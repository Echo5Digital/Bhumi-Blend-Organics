import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Customer } from "../src/models/Customer.js";
import { PendingRegistration } from "../src/models/PendingRegistration.js";
import { Setting } from "../src/models/Setting.js";
import { inlineAttachments, logoAttachment } from "../src/services/emailLogo.js";
import type { NewOrderEmailSettings } from "../src/services/newOrderEmail.js";
import { renderWelcomeEmail, sampleCustomer } from "../src/services/welcomeEmail.js";
import { adminHeader, customerHeader, fakeMailer, startTestApp } from "./helpers.js";

// The "New account" (welcome) email a new customer gets: how it looks, the admin screen for it, and when it is sent.

const settings: NewOrderEmailSettings = { enabled: true, recipients: "", subject: "", heading: "", additionalContent: "", format: "html" };
const shop = { siteName: "Bhumi Blend Organics" };
const john = { email: "john@example.com", firstName: "John", lastName: "Doe" };

describe("the welcome email itself", () => {
  it("has a subject, greets the customer by first name and gives their email as their username", () => {
    const message = renderWelcomeEmail(john, settings, shop);
    expect(message.subject).toBe("Welcome to Bhumi Blend Organics! Your account is ready");
    expect(message.html).toContain("Welcome to Bhumi Blend Organics"); // the heading
    expect(message.html).toContain("Hi John,");
    expect(message.html).toContain("Thanks for creating an account on Bhumi Blend Organics.");
    expect(message.html).toContain("<strong>john@example.com</strong>");
    expect(message.html).toContain("We look forward to seeing you soon.");
    expect(message.text).toContain("Hi John,");
    expect(message.text).toContain("Your username is your email address, john@example.com.");
    expect(message.text).toContain("We look forward to seeing you soon.");
  });

  it("carries the logo (bb_logo_.png) inside the email, so it shows even when the shop's address is a local one", () => {
    const message = renderWelcomeEmail(john, settings, { ...shop, storefrontUrl: "http://localhost:3000" });
    expect(message.html).toContain('src="cid:bb-logo"');
    expect(message.html).not.toContain("bb_logo_.png\""); // the logo isn't fetched from the shop's website (only the button links there)
    expect(message.html).not.toContain("localhost:3000/bb_logo_");
    expect(message.html).not.toContain("BHUMI BLEND</div>"); // not the text logo
    expect(message.attachments).toHaveLength(1);
    const logo = message.attachments![0]!;
    expect(logo).toMatchObject({ filename: "bb_logo_.png", cid: "bb-logo", contentType: "image/png" });
    expect([...logo.content.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // a real PNG
  });

  it("links to the account page and shows the shop's contact details when the shop has them", () => {
    const full = renderWelcomeEmail(john, settings, { ...shop, storefrontUrl: "https://shop.example", contactEmail: "hello@shop.example", contactPhone: "98470 00000" });
    expect(full.html).toContain('href="https://shop.example/my-account"');
    expect(full.html).toContain("Go to my account");
    expect(full.html).toContain("hello@shop.example · 98470 00000");
    expect(full.text).toContain("Your account: https://shop.example/my-account");

    const bare = renderWelcomeEmail(john, settings, shop);
    expect(bare.html).not.toContain("Go to my account");
    expect(bare.html).not.toContain("Reach us at");
    expect(bare.text).not.toContain("Your account:");
  });

  it("ends with the copyright line", () => {
    const message = renderWelcomeEmail(john, settings, shop);
    expect(message.html).toContain(`&copy; ${new Date().getFullYear()} Bhumi Blend Organics. All Rights Reserved.`);
    expect(message.text).toContain(`© ${new Date().getFullYear()} Bhumi Blend Organics. All Rights Reserved.`);
  });

  it("uses a custom subject, heading and extra text with the placeholders filled", () => {
    const message = renderWelcomeEmail(john, { ...settings, subject: "{customer_name}, welcome to {site_title}", heading: "Glad you're here, {customer_name}", additionalContent: "Use WELCOME10 on your first order.\nFrom all of us at {site_title}." }, shop);
    expect(message.subject).toBe("John Doe, welcome to Bhumi Blend Organics");
    expect(message.html).toContain("Glad you&#39;re here, John Doe");
    expect(message.html).toContain("Use WELCOME10 on your first order.<br>From all of us at Bhumi Blend Organics.");
    expect(message.text).toContain("Use WELCOME10 on your first order.");
  });

  it("never lets a customer's words become HTML, or a header", () => {
    const evil = `<script>alert(1)</script>"><img src=x onerror=alert(2)>`;
    const message = renderWelcomeEmail({ email: "x@example.com", firstName: evil, lastName: "Z" }, { ...settings, subject: "Hello {customer_name}" }, shop);
    expect(message.html).not.toContain("<script>");
    expect(message.html).not.toContain("<img src=x");
    expect(message.html).toContain("&lt;script&gt;");
    const injected = renderWelcomeEmail({ ...john, firstName: "John\r\nBcc: evil@example.com" }, { ...settings, subject: "Hello {customer_name}" }, shop);
    expect(injected.subject).not.toMatch(/[\r\n]/);
  });

  it("greets 'there' when there is no first name, and the sample customer is John", () => {
    expect(renderWelcomeEmail({ ...john, firstName: " " }, settings, shop).html).toContain("Hi there,");
    expect(sampleCustomer().firstName).toBe("John");
  });

  it("can put the logo into the page itself for a browser preview", () => {
    const message = renderWelcomeEmail(john, settings, shop);
    const page = inlineAttachments(message.html, message.attachments);
    expect(page).not.toContain("cid:");
    expect(page).toContain(`src="data:image/png;base64,${logoAttachment()!.content.toString("base64")}"`);
  });
});

// ---- when it is sent ------------------------------------------------------------

const signup = { firstName: "Echo", lastName: "Dev", email: "Echo@Example.com", password: "correct-horse-battery" };

describe("a new account gets the welcome email", () => {
  const mail = fakeMailer();
  let ctx: Awaited<ReturnType<typeof startTestApp>>;
  beforeAll(async () => {
    ctx = await startTestApp({ mailer: mail.mailer, env: { STOREFRONT_URL: "https://shop.example" } });
  });
  afterAll(() => ctx.stop());
  beforeEach(async () => {
    await Customer.deleteMany({});
    await PendingRegistration.deleteMany({});
    await Setting.deleteMany({});
    mail.outbox.length = 0;
  });

  const start = (extra: Partial<typeof signup> = {}) => ctx.api.post("/api/account/register").send({ ...signup, ...extra });
  const verify = (code: string, email = signup.email) => ctx.api.post("/api/account/register/verify").send({ email, code });

  it("is sent to the new customer right after the code is accepted", async () => {
    await start().expect(202);
    expect(mail.outbox).toHaveLength(1); // only the code so far
    const response = await verify(mail.lastCode());
    expect(response.status).toBe(201);

    expect(mail.outbox).toHaveLength(2);
    const welcome = mail.outbox[1]!;
    expect(welcome.to).toBe("echo@example.com");
    expect(welcome.subject).toBe("Welcome to Bhumi Blend Organics! Your account is ready");
    expect(welcome.html).toContain("Hi Echo,");
    expect(welcome.html).toContain("<strong>echo@example.com</strong>");
    expect(welcome.html).toContain('href="https://shop.example/my-account"');
    expect(welcome.html).toContain('src="cid:bb-logo"');
    expect(welcome.attachments).toEqual([expect.objectContaining({ filename: "bb_logo_.png", cid: "bb-logo" })]);
    expect(welcome.text).toContain("We look forward to seeing you soon.");
    // it has nothing in it that looks like the sign-up code
    expect(welcome.text).not.toMatch(/\b\d{6}\b/);
  });

  it("is not sent for a wrong code, or when the email already has an account", async () => {
    await start().expect(202);
    await verify(mail.lastCode() === "000000" ? "111111" : "000000").expect(400);
    expect(mail.outbox).toHaveLength(1);

    await verify(mail.lastCode()).expect(201);
    expect(mail.outbox).toHaveLength(2);
    await start().expect(409);
    expect(mail.outbox).toHaveLength(2);
  });

  it("is sent once, even if the code is sent again", async () => {
    await start().expect(202);
    const code = mail.lastCode();
    await verify(code).expect(201);
    expect((await verify(code)).status).toBe(400); // the sign-up is used up
    expect(mail.outbox.filter((message) => message.subject.startsWith("Welcome"))).toHaveLength(1);
  });

  it("uses the subject, heading and extra text saved in the admin", async () => {
    await Setting.updateOne({ _id: "general" }, { $set: { welcomeEmail: { subject: "Hello {customer_name}!", heading: "Hi from {site_title}", additionalContent: "Free shipping over 499." } } }, { upsert: true });
    await start().expect(202);
    await verify(mail.lastCode()).expect(201);
    const welcome = mail.outbox[1]!;
    expect(welcome.subject).toBe("Hello Echo Dev!");
    expect(welcome.html).toContain("Hi from Bhumi Blend Organics");
    expect(welcome.html).toContain("Free shipping over 499.");
  });

  it("is not sent when it is switched off in the admin (the account is still created)", async () => {
    await Setting.updateOne({ _id: "general" }, { $set: { welcomeEmail: { enabled: false } } }, { upsert: true });
    await start().expect(202);
    const response = await verify(mail.lastCode());
    expect(response.status).toBe(201);
    expect(mail.outbox).toHaveLength(1);
    expect(await Customer.countDocuments()).toBe(1);
  });

  it("is plain text, with no picture, when the admin chose that", async () => {
    await Setting.updateOne({ _id: "general" }, { $set: { welcomeEmail: { format: "plain" } } }, { upsert: true });
    await start().expect(202);
    await verify(mail.lastCode()).expect(201);
    const welcome = mail.outbox[1]!;
    expect(welcome.html).toBeUndefined();
    expect(welcome.attachments).toBeUndefined();
    expect(welcome.text).toContain("Hi Echo,");
  });

  it("never stops the sign-up when the mail server fails", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    await start().expect(202);
    mail.failNext(); // the welcome email is the next one to go out
    const response = await verify(mail.lastCode());
    expect(response.status).toBe(201);
    expect(typeof response.body.token).toBe("string");
    expect(await Customer.countDocuments()).toBe(1);
    expect(mail.outbox).toHaveLength(1); // only the code email went out
    expect(quiet).toHaveBeenCalledWith(expect.stringContaining("Welcome email for echo@example.com failed"), expect.anything());
    quiet.mockRestore();
  });
});

describe("a slow mail server", () => {
  it("never holds the new customer's login up for more than a few seconds", async () => {
    // the first email (the code) goes straight through; the welcome email never finishes
    let sent = 0;
    let codeEmail = "";
    const slow = {
      configured: true,
      send: async (message: { text: string }) => {
        if (++sent === 1) codeEmail = message.text;
        else await new Promise(() => {});
      },
    };
    const slowCtx = await startTestApp({ mailer: slow });
    try {
      await slowCtx.api.post("/api/account/register").send(signup).expect(202);
      const code = codeEmail.match(/\b(\d{6})\b/)![1];

      const started = Date.now();
      const response = await slowCtx.api.post("/api/account/register/verify").send({ email: signup.email, code });
      const took = Date.now() - started;
      expect(response.status).toBe(201);
      expect(took).toBeGreaterThanOrEqual(2500); // it waited for the welcome email, but only up to the limit
      expect(took).toBeLessThan(8000);
      expect(sent).toBe(2); // the welcome email was handed over
    } finally {
      await slowCtx.stop();
    }
  }, 20000);
});

// ---- the admin screen -----------------------------------------------------------

describe("Settings → Emails → New account (admin)", () => {
  const mail = fakeMailer();
  let ctx: Awaited<ReturnType<typeof startTestApp>>;
  let auth: { Authorization: string };
  beforeAll(async () => {
    ctx = await startTestApp({ mailer: mail.mailer });
    auth = await adminHeader(ctx.api);
  });
  afterAll(() => ctx.stop());
  beforeEach(async () => {
    await Setting.deleteMany({});
    mail.outbox.length = 0;
  });

  it("starts on, with no recipient field, its own wording hints and its default subject", async () => {
    const { body } = await ctx.api.get("/api/admin/emails/welcome").set(auth).expect(200);
    expect(body).toMatchObject({ key: "welcome", title: "New account", recipientsEditable: false, sample: "a sample new customer" });
    expect(body.settings).toEqual({ enabled: true, recipients: "", subject: "", heading: "", additionalContent: "", format: "html" });
    expect(body.defaults).toEqual({ recipients: "", subject: "Welcome to {site_title}! Your account is ready", heading: "Welcome to {site_title}" });
    expect(body.placeholders).toEqual(["{site_title}", "{customer_name}"]); // no order placeholders: there is no order
    expect(body.recipientLine).toContain("new customer");
    expect(body.intro).toContain("welcomes a new customer");
    // the order emails keep their own
    expect((await ctx.api.get("/api/admin/emails/new-order").set(auth)).body.placeholders).toContain("{order_number}");
  });

  it("saves its own settings without touching the other emails", async () => {
    const saved = await ctx.api.put("/api/admin/emails/welcome").set(auth).send({ enabled: false, subject: "Welcome!", heading: "Hello", additionalContent: "Enjoy", format: "plain" }).expect(200);
    expect(saved.body.settings).toEqual({ enabled: false, recipients: "", subject: "Welcome!", heading: "Hello", additionalContent: "Enjoy", format: "plain" });
    expect((await ctx.api.get("/api/admin/emails/order-received").set(auth)).body.settings.enabled).toBe(true);
    expect((await ctx.api.get("/api/admin/emails").set(auth)).body.emails.find((email: { key: string }) => email.key === "welcome").enabled).toBe(false);
    expect((await ctx.api.put("/api/admin/emails/welcome").set(auth).send({ enabled: true, subject: "", heading: "", additionalContent: "", format: "pdf" })).status).toBe(400);
  });

  it("previews it for a sample customer with what is typed, with the logo in the page, without saving", async () => {
    const preview = await ctx.api.post("/api/admin/emails/welcome/preview").set(auth).send({ heading: "Fresh heading", additionalContent: "A little extra" }).expect(200);
    expect(preview.body.subject).toBe("Welcome to Bhumi Blend Organics! Your account is ready");
    expect(preview.body.html).toContain("Fresh heading");
    expect(preview.body.html).toContain("Hi John,");
    expect(preview.body.html).toContain("A little extra");
    expect(preview.body.html).toContain('src="data:image/png;base64,'); // a browser can't open cid: pictures
    expect(preview.body.html).not.toContain("cid:");
    expect(preview.body.attachments).toBeUndefined();
    expect((await ctx.api.get("/api/admin/emails/welcome").set(auth)).body.settings.heading).toBe("");
  });

  it("sends a test copy to one address, marked as a test, with the logo attached", async () => {
    await ctx.api.post("/api/admin/emails/welcome/test").set(auth).send({ to: "me@example.com", heading: "Test heading" }).expect(200);
    expect(mail.outbox).toHaveLength(1);
    expect(mail.outbox[0]).toMatchObject({ to: "me@example.com", subject: "[TEST] Welcome to Bhumi Blend Organics! Your account is ready" });
    expect(mail.outbox[0]!.html).toContain("Test heading");
    expect(mail.outbox[0]!.html).toContain('src="cid:bb-logo"');
    expect(mail.outbox[0]!.attachments).toEqual([expect.objectContaining({ cid: "bb-logo" })]);
    expect((await ctx.api.post("/api/admin/emails/welcome/test").set(auth).send({ to: "not-an-email" })).status).toBe(400);
  });

  it("needs an admin login", async () => {
    expect((await ctx.api.get("/api/admin/emails/welcome")).status).toBe(401);
    expect((await ctx.api.post("/api/admin/emails/welcome/test").set(await customerHeader(ctx)).send({ to: "a@b.co" })).status).toBe(401);
  });
});
