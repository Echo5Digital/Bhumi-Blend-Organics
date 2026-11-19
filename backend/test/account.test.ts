import jwt from "jsonwebtoken";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Customer } from "../src/models/Customer.js";
import { Order } from "../src/models/Order.js";
import { PendingRegistration } from "../src/models/PendingRegistration.js";
import { startRegistration } from "../src/services/registration.js";
import { adminHeader, fakeGateway, fakeMailer, placeOrderWithoutAccount, startTestApp, validAddress } from "./helpers.js";

const gateway = fakeGateway();
const mail = fakeMailer();
let ctx: Awaited<ReturnType<typeof startTestApp>>;
beforeAll(async () => {
  ctx = await startTestApp({ payments: gateway.gateway, mailer: mail.mailer });
});
afterAll(() => ctx.stop());
beforeEach(async () => {
  await Customer.deleteMany({});
  await Order.deleteMany({});
  await PendingRegistration.deleteMany({});
  mail.outbox.length = 0;
});

const signup = { firstName: "Echo", lastName: "Dev", email: "Echo@Example.com", password: "correct-horse-battery" };
const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/**
 * Sign up the way a shopper does: send the details, read the code from the email,
 * enter it. Returns the final response (the account) — or the first one if the
 * details were refused before any code was sent.
 */
async function register(extra: Partial<typeof signup> = {}) {
  const input = { ...signup, ...extra };
  const start = await ctx.api.post("/api/account/register").send(input);
  if (start.status !== 202) return start;
  return ctx.api.post("/api/account/register/verify").send({ email: input.email, code: mail.lastCode() });
}

describe("registering", () => {
  it("creates an account and logs the shopper straight in", async () => {
    const response = await register();
    expect(response.status).toBe(201);
    expect(response.body.customer).toMatchObject({
      email: "echo@example.com",
      firstName: "Echo",
      lastName: "Dev",
      displayName: "Echo Dev",
      addresses: {},
    });
    expect(typeof response.body.token).toBe("string");
    // The password and its hash never come back.
    expect(JSON.stringify(response.body)).not.toMatch(/passwordHash|correct-horse/);

    const stored = await Customer.findOne({ email: "echo@example.com" }).select("+passwordHash");
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/); // a bcrypt hash, not the password
  });

  it("refuses an email that already has an account (in any letter case)", async () => {
    await register();
    const again = await register({ email: "ECHO@example.com" });
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe("EMAIL_TAKEN");
    expect(await Customer.countDocuments()).toBe(1);
  });

  it("explains every problem at once", async () => {
    const response = await register({ firstName: "", email: "nope", password: "short" });
    expect(response.status).toBe(400);
    const paths = response.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(["firstName", "email", "password"]));
    expect(await Customer.countDocuments()).toBe(0);
  });

  it("limits password length to what bcrypt really uses", async () => {
    expect((await register({ password: "x".repeat(73) })).status).toBe(400);
    expect((await register({ password: "x".repeat(72) })).status).toBe(201);
  });
});

// ---- the emailed one-time code ---------------------------------------------

const start = (extra: Partial<typeof signup> = {}) => ctx.api.post("/api/account/register").send({ ...signup, ...extra });
const verify = (code: string, email = "echo@example.com") => ctx.api.post("/api/account/register/verify").send({ email, code });
const resend = (email = "echo@example.com") => ctx.api.post("/api/account/register/resend").send({ email });
const wrongCode = () => (mail.lastCode() === "000000" ? "111111" : "000000");
/** Pretend the last code was sent a minute ago, so the 30-second wait is over. */
const waitOutCooldown = (email = "echo@example.com") =>
  PendingRegistration.updateOne({ email }, { lastSentAt: new Date(Date.now() - 60_000) });

describe("email verification code", () => {
  it("emails a 6-digit code and creates no account yet", async () => {
    const response = await start();
    expect(response.status).toBe(202);
    expect(response.body).toEqual({ status: "verification_sent", email: "echo@example.com", expiresInSeconds: 600, resendAfterSeconds: 30, delivery: "email" });
    expect(response.body.token).toBeUndefined();
    expect(await Customer.countDocuments()).toBe(0);

    expect(mail.outbox).toHaveLength(1);
    const email = mail.outbox[0]!;
    expect(email.to).toBe("echo@example.com");
    expect(email.text).toContain("Hi Echo");
    expect(mail.lastCode()).toMatch(/^\d{6}$/);
    expect(email.subject).toContain(mail.lastCode());
    expect(email.html).toContain(mail.lastCode());
    // the API never hands the code back to whoever asked for it
    expect(JSON.stringify(response.body)).not.toContain(mail.lastCode());
  });

  it("says the code went to the console, not an inbox, when no SMTP is set up (development)", async () => {
    // a mailer that is "not configured", like the console one used in development
    const devMailer = { configured: false, send: async () => {} };
    const result = await startRegistration({ ...signup, email: "dev@example.com" }, { env: ctx.env, mailer: devMailer });
    expect(result.delivery).toBe("console");
    await PendingRegistration.deleteOne({ email: "dev@example.com" });
  });

  it("keeps neither the password nor the code in plain text", async () => {
    await start();
    const pending = await PendingRegistration.findOne({ email: "echo@example.com" }).select("+passwordHash +otpHash");
    expect(pending?.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(pending?.otpHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(pending)).not.toContain(mail.lastCode());
    expect(JSON.stringify(pending)).not.toContain(signup.password);
  });

  it("creates the account — verified, and logged in — when the right code is entered", async () => {
    await start();
    const response = await verify(mail.lastCode());
    expect(response.status).toBe(201);
    expect(response.body.customer).toMatchObject({ email: "echo@example.com", displayName: "Echo Dev" });
    expect(typeof response.body.token).toBe("string");

    const stored = await Customer.findOne({ email: "echo@example.com" });
    expect(stored?.emailVerifiedAt).toBeInstanceOf(Date);
    expect(await PendingRegistration.countDocuments()).toBe(0);
    await ctx.api.post("/api/account/login").send({ email: "echo@example.com", password: signup.password }).expect(200);
  });

  it("works once only", async () => {
    await start();
    const code = mail.lastCode();
    await verify(code).expect(201);
    const again = await verify(code);
    expect(again.status).toBe(400);
    expect(again.body.error.code).toBe("OTP_NOT_FOUND");
    expect(await Customer.countDocuments()).toBe(1);
  });

  it("counts down the tries on a wrong code, then throws the sign-up away", async () => {
    await start();
    const first = await verify(wrongCode());
    expect(first.status).toBe(400);
    expect(first.body.error).toMatchObject({ code: "OTP_INVALID", details: { attemptsLeft: 4 } });
    expect(first.body.error.message).toContain("4 tries");

    for (let tries = 3; tries >= 1; tries--) {
      expect((await verify(wrongCode())).body.error.details.attemptsLeft).toBe(tries);
    }
    const last = await verify(wrongCode());
    expect(last.body.error.code).toBe("OTP_TOO_MANY_ATTEMPTS");

    // even the right code is dead now: the shopper has to start again
    const lateRight = await verify(mail.lastCode());
    expect(lateRight.body.error.code).toBe("OTP_NOT_FOUND");
    expect(await Customer.countDocuments()).toBe(0);
  });

  it("never allows more than five guesses, even when they arrive at the same moment", async () => {
    await start();
    const burst = await Promise.all(Array.from({ length: 12 }, () => verify(wrongCode())));
    const codes = burst.map((response) => response.body.error.code as string);
    expect(codes.filter((code) => code === "OTP_INVALID").length).toBeLessThanOrEqual(5);
    expect(codes.every((code) => ["OTP_INVALID", "OTP_TOO_MANY_ATTEMPTS", "OTP_NOT_FOUND"].includes(code))).toBe(true);

    const right = await verify(mail.lastCode());
    expect(right.status).toBe(400); // the real code no longer helps
    expect(await Customer.countDocuments()).toBe(0);
  });

  it("refuses an expired code, and a resend gives a working one", async () => {
    await start();
    const old = mail.lastCode();
    await PendingRegistration.updateOne({ email: "echo@example.com" }, { otpExpiresAt: new Date(Date.now() - 1000) });
    const expired = await verify(old);
    expect(expired.body.error.code).toBe("OTP_EXPIRED");

    await waitOutCooldown();
    await resend().expect(200);
    await verify(mail.lastCode()).expect(201);
  });

  it("only accepts a code made of six digits", async () => {
    await start();
    for (const bad of ["12345", "1234567", "abcdef", "12 456", ""]) {
      const response = await verify(bad);
      expect(response.status, bad).toBe(400);
      expect(response.body.error.code, bad).toBe("VALIDATION_ERROR");
    }
    // none of those used up a try
    expect((await PendingRegistration.findOne({ email: "echo@example.com" }))?.attempts).toBe(0);
  });

  it("ties a code to its own email address", async () => {
    await start({ email: "a@example.com" });
    const codeForA = mail.lastCode();
    await start({ email: "b@example.com" });
    const response = await verify(codeForA, "b@example.com");
    expect(response.body.error.code).toBe("OTP_INVALID");
    expect(await Customer.countDocuments()).toBe(0);
  });

  it("answers 'sign-up expired' when there is no sign-up waiting", async () => {
    expect((await verify("123456")).body.error.code).toBe("OTP_NOT_FOUND");
    expect((await resend()).body.error.code).toBe("OTP_NOT_FOUND");
  });

  it("won't start a sign-up for an email that already has an account — and sends nothing", async () => {
    await register();
    mail.outbox.length = 0;
    const response = await start();
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("EMAIL_TAKEN");
    expect(mail.outbox).toHaveLength(0);
  });
});

describe("asking for another code", () => {
  it("makes you wait 30 seconds, then sends a new code that replaces the old one", async () => {
    await start();
    const first = mail.lastCode();

    const tooSoon = await resend();
    expect(tooSoon.status).toBe(429);
    expect(tooSoon.body.error.code).toBe("OTP_COOLDOWN");
    expect(tooSoon.body.error.details.retryAfterSeconds).toBeGreaterThan(0);
    expect(tooSoon.body.error.details.retryAfterSeconds).toBeLessThanOrEqual(30);
    expect(mail.outbox).toHaveLength(1);

    await waitOutCooldown();
    await resend().expect(200);
    expect(mail.outbox).toHaveLength(2);

    const second = mail.lastCode();
    if (second !== first) expect((await verify(first)).body.error.code).toBe("OTP_INVALID"); // the old one is dead
    await verify(second).expect(201);
  });

  it("starts the wrong-guess count again with each new code", async () => {
    await start();
    for (let i = 0; i < 3; i++) await verify(wrongCode());
    await waitOutCooldown();
    await resend().expect(200);
    expect((await verify(wrongCode())).body.error.details.attemptsLeft).toBe(4);
  });

  it("stops after five codes for one sign-up", async () => {
    await start();
    await PendingRegistration.updateOne({ email: "echo@example.com" }, { sendCount: 5, lastSentAt: new Date(Date.now() - 60_000) });
    const response = await resend();
    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe("OTP_SEND_LIMIT");
    expect(mail.outbox).toHaveLength(1);
  });

  it("lets a shopper correct their details by registering again once the wait is over", async () => {
    await start();
    expect((await start({ firstName: "Eko" })).body.error.code).toBe("OTP_COOLDOWN"); // too soon
    await waitOutCooldown();
    await start({ firstName: "Eko", password: "a-different-password" }).expect(202);

    const response = await verify(mail.lastCode());
    expect(response.body.customer.firstName).toBe("Eko");
    expect(await Customer.countDocuments()).toBe(1);
    const old = await ctx.api.post("/api/account/login").send({ email: "echo@example.com", password: signup.password });
    expect(old.status).toBe(401);
    await ctx.api.post("/api/account/login").send({ email: "echo@example.com", password: "a-different-password" }).expect(200);
  });
});

describe("when the email can't be sent", () => {
  it("tells the shopper, and leaves no half-finished sign-up behind", async () => {
    mail.failNext();
    const response = await start();
    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe("EMAIL_FAILED");
    expect(await PendingRegistration.countDocuments()).toBe(0);
    expect(await Customer.countDocuments()).toBe(0);

    await start().expect(202); // trying again works straight away (no cooldown for a send that never happened)
  });
});

describe("logging in", () => {
  it("accepts the right password, in any email case", async () => {
    await register();
    const response = await ctx.api.post("/api/account/login").send({ email: " ECHO@example.com ", password: signup.password });
    expect(response.status).toBe(200);
    expect(response.body.customer.displayName).toBe("Echo Dev");
    const me = await ctx.api.get("/api/account/me").set(bearer(response.body.token)).expect(200);
    expect(me.body.customer.email).toBe("echo@example.com");
  });

  it("answers a wrong password and an unknown email identically", async () => {
    await register();
    const wrongPassword = await ctx.api.post("/api/account/login").send({ email: "echo@example.com", password: "wrong-wrong-wrong" });
    const unknown = await ctx.api.post("/api/account/login").send({ email: "who@example.com", password: signup.password });
    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(unknown.body).toEqual(wrongPassword.body);
  });

  it("locks out a switched-off account, even with a token from before", async () => {
    const { body } = await register();
    await Customer.updateOne({ email: "echo@example.com" }, { isActive: false });
    expect((await ctx.api.post("/api/account/login").send({ email: "echo@example.com", password: signup.password })).status).toBe(401);
    expect((await ctx.api.get("/api/account/me").set(bearer(body.token))).status).toBe(401);
  });
});

describe("tokens", () => {
  it("are required, and an admin token is no use on the customer routes (or the reverse)", async () => {
    const { body } = await register();
    expect((await ctx.api.get("/api/account/me")).status).toBe(401);
    expect((await ctx.api.get("/api/account/me").set(bearer("nonsense"))).body.error.code).toBe("TOKEN_INVALID");

    const admin = await adminHeader(ctx.api);
    expect((await ctx.api.get("/api/account/me").set(admin)).status).toBe(401);
    expect((await ctx.api.get("/api/admin/stats").set(bearer(body.token))).status).toBe(401);
  });

  it("must be signed with this server's secret", async () => {
    const { body } = await register();
    const forged = jwt.sign({ role: "customer" }, "some-other-secret-some-other-secret-xx", { subject: body.customer.id });
    expect((await ctx.api.get("/api/account/me").set(bearer(forged))).status).toBe(401);
  });
});

describe("account details", () => {
  it("changes the name without asking for the password", async () => {
    const { body } = await register();
    const response = await ctx.api.patch("/api/account/me").set(bearer(body.token)).send({ firstName: "Echoes" }).expect(200);
    expect(response.body.customer).toMatchObject({ firstName: "Echoes", displayName: "Echoes Dev" });
  });

  it("needs the current password to change the email or the password", async () => {
    const { body } = await register();
    const auth = bearer(body.token);

    const noPassword = await ctx.api.patch("/api/account/me").set(auth).send({ email: "new@example.com" });
    expect(noPassword.status).toBe(400);
    expect(noPassword.body.error.details[0].path).toBe("currentPassword");
    const wrong = await ctx.api.patch("/api/account/me").set(auth).send({ newPassword: "brand-new-password", currentPassword: "wrong-wrong" });
    expect(wrong.body.error.code).toBe("INVALID_CURRENT_PASSWORD");

    await ctx.api.patch("/api/account/me").set(auth).send({ email: "New@Example.com", currentPassword: signup.password }).expect(200);
    await ctx.api.patch("/api/account/me").set(auth).send({ newPassword: "brand-new-password", currentPassword: signup.password }).expect(200);

    // old password is dead, new one works, on the new email
    const old = await ctx.api.post("/api/account/login").send({ email: "new@example.com", password: signup.password });
    expect(old.status).toBe(401);
    await ctx.api.post("/api/account/login").send({ email: "new@example.com", password: "brand-new-password" }).expect(200);
  });

  it("won't take an email that belongs to someone else", async () => {
    await register({ email: "taken@example.com" });
    const { body } = await register();
    const response = await ctx.api.patch("/api/account/me").set(bearer(body.token)).send({ email: "taken@example.com", currentPassword: signup.password });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("EMAIL_TAKEN");
  });

  it("rejects an empty change", async () => {
    const { body } = await register();
    expect((await ctx.api.patch("/api/account/me").set(bearer(body.token)).send({})).status).toBe(400);
  });
});

describe("address book", () => {
  it("saves shipping and billing addresses separately", async () => {
    const { body } = await register();
    const auth = bearer(body.token);
    await ctx.api.put("/api/account/addresses/shipping").set(auth).send(validAddress).expect(200);
    const saved = await ctx.api.put("/api/account/addresses/billing").set(auth).send({ ...validAddress, city: "Pune", state: "Maharashtra", pin: "411001" }).expect(200);
    expect(saved.body.customer.addresses.shipping).toMatchObject({ city: "Kochi", phone: "9876543210" });
    expect(saved.body.customer.addresses.billing).toMatchObject({ city: "Pune", state: "Maharashtra" });

    const me = await ctx.api.get("/api/account/me").set(auth).expect(200);
    expect(me.body.customer.addresses.shipping.line1).toBe("12 Temple Road");
  });

  it("validates the address and the kind", async () => {
    const { body } = await register();
    const auth = bearer(body.token);
    const bad = await ctx.api.put("/api/account/addresses/shipping").set(auth).send({ ...validAddress, pin: "12" });
    expect(bad.status).toBe(400);
    expect(bad.body.error.details[0].path).toBe("pin");
    expect((await ctx.api.put("/api/account/addresses/home").set(auth).send(validAddress)).status).toBe(400);
    expect((await ctx.api.put("/api/account/addresses/shipping").send(validAddress)).status).toBe(401);
  });
});

describe("orders in the account", () => {
  const cart = { items: [{ slug: "aloe-pure-shampoo", qty: 1 }], email: "echo@example.com", shipping: validAddress };

  it("shows orders placed while logged in, and only the owner's", async () => {
    const mine = (await register()).body;
    const other = (await register({ email: "other@example.com" })).body;

    const placed = await ctx.api.post("/api/orders").set(bearer(mine.token)).send(cart).expect(201);
    await ctx.api.post("/api/orders").send(cart).expect(401); // no login, no order
    await ctx.api.post("/api/orders").set(bearer(other.token)).send(cart).expect(201);

    const list = await ctx.api.get("/api/account/orders").set(bearer(mine.token)).expect(200);
    expect(list.body.total).toBe(1);
    expect(list.body.items[0]).toMatchObject({ number: placed.body.order.number, total: 599, paymentStatus: "pending" });

    const one = await ctx.api.get(`/api/account/orders/${placed.body.order.number}`).set(bearer(mine.token)).expect(200);
    expect(one.body.order.items[0].name).toBe("Aloe Pure Shampoo");
    // someone else's order looks like it doesn't exist
    const theirs = await ctx.api.get(`/api/account/orders/${placed.body.order.number}`).set(bearer(other.token));
    expect(theirs.status).toBe(404);
  });

  it("does not hand a new account the orders with no account that carry the same email (like ones imported from the old shop)", async () => {
    await placeOrderWithoutAccount(ctx, cart);
    const { body } = await register({ email: "echo@example.com" });
    const list = await ctx.api.get("/api/account/orders").set(bearer(body.token)).expect(200);
    expect(list.body.total).toBe(0);
  });

  it("leaves out orders cancelled before payment, newest first", async () => {
    const { body } = await register();
    const first = (await ctx.api.post("/api/orders").set(bearer(body.token)).send(cart)).body;
    const second = (await ctx.api.post("/api/orders").set(bearer(body.token)).send(cart)).body;
    await ctx.api.post(`/api/orders/${first.order.number}/cancel`).set("X-Order-Token", first.accessToken).expect(200);

    const list = await ctx.api.get("/api/account/orders").set(bearer(body.token)).expect(200);
    expect(list.body.items.map((o: { number: number }) => o.number)).toEqual([second.order.number]);
  });

  it("refuses a stale or bogus login token instead of falling back to a guest order", async () => {
    const response = await ctx.api.post("/api/orders").set(bearer("stale-token")).send(cart);
    expect(response.status).toBe(401);
    expect(await Order.countDocuments()).toBe(0);
  });

  it("refuses the order of an account the admin has switched off", async () => {
    const { body } = await register();
    await Customer.updateOne({ email: "echo@example.com" }, { isActive: false });
    await ctx.api.post("/api/orders").set(bearer(body.token)).send(cart).expect(401);
    expect(await Order.countDocuments()).toBe(0);
  });
});
