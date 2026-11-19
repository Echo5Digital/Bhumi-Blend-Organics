import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Order } from "../src/models/Order.js";
import { Setting } from "../src/models/Setting.js";
import { renderNewOrderEmail, sampleOrder, type NewOrderEmailSettings } from "../src/services/newOrderEmail.js";
import { adminHeader, customerHeader, fakeGateway, fakeMailer, paymentSignature, startTestApp, validAddress, webhookSignature } from "./helpers.js";

// The "New order" email: how it looks, the admin screen that controls it, and when it is sent.

const settings: NewOrderEmailSettings = { enabled: true, recipients: "owner@example.com", subject: "", heading: "", additionalContent: "", format: "html" };
const context = { siteName: "Bhumi Blend Organics" };

describe("the email itself", () => {
  it("fills in the default subject and heading", () => {
    const message = renderNewOrderEmail(sampleOrder(), settings, context);
    expect(message.subject).toBe("[Bhumi Blend Organics]: New order #20001");
    expect(message.html).toContain("New order: #20001");
  });

  it("uses a custom subject, heading and extra text, with the placeholders filled", () => {
    const message = renderNewOrderEmail(sampleOrder(), { ...settings, subject: "{customer_name} ordered (#{order_number})", heading: "Cha-ching, #{order_number}!", additionalContent: "Pack it with care.\nThanks, {site_title}" }, context);
    expect(message.subject).toBe("Asha Nair ordered (#20001)");
    expect(message.html).toContain("Cha-ching, #20001!");
    expect(message.html).toContain("Pack it with care.<br>Thanks, Bhumi Blend Organics");
    expect(message.text).toContain("Pack it with care.");
  });

  it("shows what was ordered, the totals, the coupon and both addresses", () => {
    const order = sampleOrder();
    const { html, text } = renderNewOrderEmail({ ...order, billingSameAsShipping: false, billing: { ...order.billing, city: "Pune", pin: "411001", state: "Maharashtra" } }, settings, context);
    for (const expected of ["Organic Saffron Gel", "Aloe Pure Shampoo", "₹1,617.30", "₹1,797.00", "WELCOME10", "Free", "Shipping address", "Billing address", "Pune 411001", "asha@example.com", "Please deliver after 6 pm.", "Payment pending"]) {
      expect(html).toContain(expected);
    }
    expect(text).toContain("Aloe Pure Shampoo (200ml) x 2: ₹1,198.00");
    expect(text).toContain("BILLING ADDRESS");
  });

  it("says Paid for a paid order", () => {
    expect(renderNewOrderEmail({ ...sampleOrder(), paymentStatus: "paid" }, settings, context).html).toContain(">Paid<");
  });

  it("never lets a customer's words become HTML", () => {
    const order = sampleOrder();
    const evil = `<script>alert(1)</script>"><img src=x onerror=alert(2)>`;
    const { html, subject } = renderNewOrderEmail(
      { ...order, note: evil, shipping: { ...order.shipping, firstName: evil }, items: [{ ...order.items[0]!, name: evil }] },
      { ...settings, additionalContent: evil },
      context,
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(subject).toBeTypeOf("string");
  });

  it("keeps a customer's newline out of the subject", () => {
    const order = sampleOrder();
    const { subject } = renderNewOrderEmail({ ...order, shipping: { ...order.shipping, firstName: "Asha\r\nBcc: evil@example.com" } }, { ...settings, subject: "Order from {customer_name}" }, context);
    expect(subject).not.toMatch(/[\r\n]/);
  });

  it("links to the order in the admin and uses the logo only when the shop has a public https address", () => {
    const local = renderNewOrderEmail(sampleOrder(), settings, { ...context, storefrontUrl: "http://localhost:3000" });
    expect(local.html).toContain("http://localhost:3000/adminecho5/orders/20001");
    expect(local.html).not.toContain("bb_logo_.png"); // a phone can't open localhost

    const live = renderNewOrderEmail(sampleOrder(), settings, { ...context, storefrontUrl: "https://bhumiblend.example" });
    expect(live.html).toContain("https://bhumiblend.example/bb_logo_.png");
    expect(live.html).toContain("https://bhumiblend.example/adminecho5/orders/20001");

    expect(renderNewOrderEmail(sampleOrder(), settings, context).html).not.toContain("View order in admin");
  });
});

// ---- the admin screen -----------------------------------------------------------

describe("Settings → Emails → New order (admin)", () => {
  const mail = fakeMailer();
  let ctx: Awaited<ReturnType<typeof startTestApp>>;
  let auth: { Authorization: string };
  beforeAll(async () => {
    ctx = await startTestApp({ mailer: mail.mailer, env: { ORDER_NOTIFY_EMAILS: "default-owner@example.com" } });
    auth = await adminHeader(ctx.api);
  });
  afterAll(() => ctx.stop());
  beforeEach(async () => {
    await Setting.deleteMany({});
    mail.outbox.length = 0;
  });

  it("needs an admin login", async () => {
    expect((await ctx.api.get("/api/admin/emails/new-order")).status).toBe(401);
    expect((await ctx.api.put("/api/admin/emails/new-order").send({})).status).toBe(401);
    expect((await ctx.api.post("/api/admin/emails/new-order/preview").send({})).status).toBe(401);
    expect((await ctx.api.post("/api/admin/emails/new-order/test").send({ to: "a@b.co" })).status).toBe(401);
    const shopper = await customerHeader(ctx);
    expect((await ctx.api.get("/api/admin/emails/new-order").set(shopper)).status).toBe(401);
  });

  it("starts on: enabled, to the address set in .env, with the default wording as placeholders", async () => {
    const { body } = await ctx.api.get("/api/admin/emails/new-order").set(auth).expect(200);
    expect(body.settings).toEqual({ enabled: true, recipients: "default-owner@example.com", subject: "", heading: "", additionalContent: "", format: "html" });
    expect(body.defaults).toEqual({ recipients: "default-owner@example.com", subject: "[{site_title}]: New order #{order_number}", heading: "New order: #{order_number}" });
    expect(body.placeholders).toContain("{order_number}");
  });

  it("saves the settings and reads them back", async () => {
    const values = { enabled: false, recipients: "a@example.com, B@Example.com;c@example.com", subject: "New: #{order_number}", heading: "Hi", additionalContent: "Thanks!", format: "plain" };
    const saved = await ctx.api.put("/api/admin/emails/new-order").set(auth).send(values).expect(200);
    expect(saved.body.settings).toMatchObject({ ...values });
    expect((await ctx.api.get("/api/admin/emails/new-order").set(auth)).body.settings).toMatchObject({ enabled: false, format: "plain", heading: "Hi" });
  });

  it("falls back to the .env address when the recipients are cleared", async () => {
    await ctx.api.put("/api/admin/emails/new-order").set(auth).send({ enabled: true, recipients: "x@example.com", subject: "", heading: "", additionalContent: "", format: "html" }).expect(200);
    const cleared = await ctx.api.put("/api/admin/emails/new-order").set(auth).send({ enabled: true, recipients: "", subject: "", heading: "", additionalContent: "", format: "html" }).expect(200);
    expect(cleared.body.settings.recipients).toBe("default-owner@example.com");
  });

  it("refuses a bad address or a bad format, naming the field", async () => {
    const ok = { enabled: true, recipients: "a@example.com", subject: "", heading: "", additionalContent: "", format: "html" };
    const badAddress = await ctx.api.put("/api/admin/emails/new-order").set(auth).send({ ...ok, recipients: "a@example.com, not-an-email" });
    expect(badAddress.status).toBe(400);
    expect(badAddress.body.error.details[0].path).toBe("recipients");
    expect((await ctx.api.put("/api/admin/emails/new-order").set(auth).send({ ...ok, format: "pdf" })).status).toBe(400);
    expect((await ctx.api.put("/api/admin/emails/new-order").set(auth).send({ ...ok, subject: "x".repeat(201) })).status).toBe(400);
  });

  it("previews what is typed on the page without saving it", async () => {
    const preview = await ctx.api.post("/api/admin/emails/new-order/preview").set(auth).send({ heading: "Fresh heading #{order_number}", additionalContent: "Extra words" }).expect(200);
    expect(preview.body.subject).toBe("[Bhumi Blend Organics]: New order #20001");
    expect(preview.body.html).toContain("Fresh heading #20001");
    expect(preview.body.html).toContain("Extra words");
    expect(preview.body.format).toBe("html");
    expect((await ctx.api.get("/api/admin/emails/new-order").set(auth)).body.settings.heading).toBe("");
  });

  it("sends a test email to one address, marked as a test", async () => {
    const sent = await ctx.api.post("/api/admin/emails/new-order/test").set(auth).send({ to: "me@example.com", heading: "Test heading" }).expect(200);
    expect(sent.body.sent).toBe(true);
    expect(mail.outbox).toHaveLength(1);
    expect(mail.outbox[0]).toMatchObject({ to: "me@example.com", subject: "[TEST] [Bhumi Blend Organics]: New order #20001" });
    expect(mail.outbox[0]!.html).toContain("Test heading");
    expect((await ctx.api.post("/api/admin/emails/new-order/test").set(auth).send({ to: "nope" })).status).toBe(400);
  });

  it("sends plain text only when the type is plain", async () => {
    await ctx.api.post("/api/admin/emails/new-order/test").set(auth).send({ to: "me@example.com", format: "plain" }).expect(200);
    expect(mail.outbox[0]!.html).toBeUndefined();
    expect(mail.outbox[0]!.text).toContain("WHAT WAS ORDERED");
  });

  it("keeps the owner's address out of the shop's public settings", async () => {
    await ctx.api.put("/api/admin/emails/new-order").set(auth).send({ enabled: true, recipients: "secret-owner@example.com", subject: "", heading: "", additionalContent: "", format: "html" }).expect(200);
    const publicSettings = await ctx.api.get("/api/settings").expect(200);
    expect(JSON.stringify(publicSettings.body)).not.toContain("secret-owner@example.com");
    expect(JSON.stringify((await ctx.api.get("/api/admin/settings").set(auth)).body)).not.toContain("secret-owner@example.com");
  });
});

// ---- when it is sent --------------------------------------------------------------

const cart = { items: [{ slug: "aloe-pure-shampoo", qty: 1 }], email: "buyer@example.com", shipping: validAddress };

// These tests are about the owner's email, so the customer's copy is switched off to keep the inbox count clear
// (the customer's email has its own tests in customer-order-email.test.ts).
async function setNewOrderEmail(values: Record<string, unknown>) {
  await Setting.updateOne({ _id: "general" }, { $set: { newOrderEmail: values, customerOrderEmail: { enabled: false } } }, { upsert: true });
}

describe("online payment not set up: the email goes out when the shopper confirms (Pay Now)", () => {
  const mail = fakeMailer();
  let ctx: Awaited<ReturnType<typeof startTestApp>>;
  beforeAll(async () => {
    ctx = await startTestApp({ payments: fakeGateway({ configured: false }).gateway, mailer: mail.mailer });
  });
  afterAll(() => ctx.stop());
  beforeEach(async () => {
    await Order.deleteMany({});
    await Setting.deleteMany({});
    mail.outbox.length = 0;
  });

  async function place() {
    const placed = (await ctx.api.post("/api/orders").set(await customerHeader(ctx)).send(cart).expect(201)).body;
    return { number: placed.order.number as number, header: { "X-Order-Token": placed.accessToken as string } };
  }
  const confirm = (order: Awaited<ReturnType<typeof place>>) => ctx.api.post(`/api/orders/${order.number}/confirm`).set(order.header);
  const notes = async (number: number) => ((await Order.findOne({ number }))?.notes ?? []).map((note) => note.text);

  it("sends nothing just for placing the order, only when it is confirmed", async () => {
    await setNewOrderEmail({ recipients: "owner@example.com" });
    const order = await place();
    expect(mail.outbox).toHaveLength(0);
    await confirm(order).expect(200);
    expect(mail.outbox).toHaveLength(1);
    expect(mail.outbox[0]).toMatchObject({ to: "owner@example.com", subject: `[Bhumi Blend Organics]: New order #${order.number}` });
    expect(mail.outbox[0]!.html).toContain("Payment pending");
    expect(await notes(order.number)).toContain("New-order email sent to owner@example.com.");
  });

  it("sends it to every recipient, in one message", async () => {
    await setNewOrderEmail({ recipients: "a@example.com, b@example.com" });
    await confirm(await place()).expect(200);
    expect(mail.outbox).toHaveLength(1);
    expect(mail.outbox[0]!.to).toBe("a@example.com, b@example.com");
  });

  it("sends it once, however often Pay Now is pressed", async () => {
    await setNewOrderEmail({ recipients: "owner@example.com" });
    const order = await place();
    await confirm(order).expect(200);
    await confirm(order).expect(200);
    await Promise.all([confirm(order), confirm(order)]);
    expect(mail.outbox).toHaveLength(1);
  });

  it("sends nothing when the email is switched off or has no recipient — and the shopper is not affected", async () => {
    await setNewOrderEmail({ enabled: false, recipients: "owner@example.com" });
    await confirm(await place()).expect(200);
    await setNewOrderEmail({ enabled: true, recipients: "" });
    await confirm(await place()).expect(200);
    expect(mail.outbox).toHaveLength(0);
  });

  it("does not let an email problem reach the shopper, writes it on the order, and tries again next time", async () => {
    await setNewOrderEmail({ recipients: "owner@example.com" });
    const order = await place();
    mail.failNext();
    await confirm(order).expect(200); // the shopper's order still goes through
    expect(mail.outbox).toHaveLength(0);
    expect(await notes(order.number)).toContain("The new-order email could not be sent to owner@example.com.");
    expect((await Order.findOne({ number: order.number }))?.newOrderEmailSentAt).toBeUndefined();

    await confirm(order).expect(200); // pressing again retries
    expect(mail.outbox).toHaveLength(1);
  });

  it("uses the plain-text type when the admin chose it", async () => {
    await setNewOrderEmail({ recipients: "owner@example.com", format: "plain" });
    await confirm(await place()).expect(200);
    expect(mail.outbox[0]!.html).toBeUndefined();
  });

  it("only confirms an open order that belongs to the caller", async () => {
    await setNewOrderEmail({ recipients: "owner@example.com" });
    const order = await place();
    expect((await ctx.api.post(`/api/orders/${order.number}/confirm`)).status).toBe(404); // no token
    expect((await ctx.api.post(`/api/orders/${order.number}/confirm`).set("X-Order-Token", "wrong")).status).toBe(404);

    await ctx.api.post(`/api/orders/${order.number}/cancel`).set(order.header).expect(200);
    const refused = await confirm(order);
    expect(refused.status).toBe(409);
    expect(refused.body.error.code).toBe("ORDER_NOT_CONFIRMABLE");
    expect(mail.outbox).toHaveLength(0);
  });
});

describe("online payment set up: the email goes out when the payment goes through", () => {
  const mail = fakeMailer();
  const gateway = fakeGateway();
  let ctx: Awaited<ReturnType<typeof startTestApp>>;
  beforeAll(async () => {
    ctx = await startTestApp({ payments: gateway.gateway, mailer: mail.mailer });
  });
  afterAll(() => ctx.stop());
  beforeEach(async () => {
    await Order.deleteMany({});
    await Setting.deleteMany({});
    mail.outbox.length = 0;
    await setNewOrderEmail({ recipients: "owner@example.com" });
  });

  async function place() {
    const placed = (await ctx.api.post("/api/orders").set(await customerHeader(ctx)).send(cart).expect(201)).body;
    return { number: placed.order.number as number, token: placed.accessToken as string, rzp: placed.payment.razorpayOrderId as string };
  }
  const verify = (order: Awaited<ReturnType<typeof place>>) =>
    ctx.api
      .post(`/api/orders/${order.number}/verify-payment`)
      .set("X-Order-Token", order.token)
      .send({ razorpay_order_id: order.rzp, razorpay_payment_id: "pay_1", razorpay_signature: paymentSignature(order.rzp, "pay_1") });

  it("sends nothing for an order that is not paid, and Pay Now (confirm) is refused for it", async () => {
    const order = await place();
    expect(mail.outbox).toHaveLength(0);
    const refused = await ctx.api.post(`/api/orders/${order.number}/confirm`).set("X-Order-Token", order.token);
    expect(refused.status).toBe(409);
    expect(refused.body.error.code).toBe("ORDER_NEEDS_PAYMENT");
    expect(mail.outbox).toHaveLength(0);
  });

  it("sends it when the payment is verified, saying Paid, and not again on a replay", async () => {
    const order = await place();
    await verify(order).expect(200);
    expect(mail.outbox).toHaveLength(1);
    expect(mail.outbox[0]!.html).toContain(">Paid<");
    await verify(order).expect(200);
    expect(mail.outbox).toHaveLength(1);
  });

  it("sends it once when Razorpay's webhook and the browser both report the payment", async () => {
    const order = await place();
    const total = (await Order.findOne({ number: order.number }))!.total;
    const raw = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1", order_id: order.rzp, amount: Math.round(total * 100) } } } });
    await ctx.api.post("/api/webhooks/razorpay").set("Content-Type", "application/json").set("X-Razorpay-Signature", webhookSignature(raw)).send(raw).expect(200);
    expect(mail.outbox).toHaveLength(1);
    await verify(order).expect(200);
    expect(mail.outbox).toHaveLength(1);
  });
});
