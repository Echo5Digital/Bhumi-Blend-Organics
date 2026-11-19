import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { renderCustomerOrderEmail } from "../src/services/customerOrderEmail.js";
import { sampleOrder, type NewOrderEmailSettings } from "../src/services/newOrderEmail.js";
import { Order } from "../src/models/Order.js";
import { Setting } from "../src/models/Setting.js";
import { adminHeader, customerHeader, fakeGateway, fakeMailer, paymentSignature, startTestApp, validAddress, webhookSignature } from "./helpers.js";

// The "Order received" email the customer gets after ordering: how it looks, the admin screen for it, and when it is sent.

const settings: NewOrderEmailSettings = { enabled: true, recipients: "", subject: "", heading: "", additionalContent: "", format: "html" };
const context = { siteName: "Bhumi Blend Organics" };

describe("the customer's email itself", () => {
  it("uses the default subject and heading, and greets the customer by first name", () => {
    const message = renderCustomerOrderEmail(sampleOrder(), settings, context);
    expect(message.subject).toBe("Your Bhumi Blend Organics order has been received!");
    expect(message.html).toContain("Thank you for your order");
    expect(message.html).toContain("Hi Asha,");
    expect(message.text).toContain("Hi Asha,");
  });

  it("says payment is pending for an unpaid order and that it was received for a paid one", () => {
    const pending = renderCustomerOrderEmail(sampleOrder(), settings, context);
    expect(pending.html).toContain("Payment for it is still pending");
    expect(pending.html).toContain("Payment pending");

    const paid = renderCustomerOrderEmail({ ...sampleOrder(), paymentStatus: "paid" }, settings, context);
    expect(paid.html).toContain("We&#39;ve received your payment"); // the apostrophe is escaped in HTML
    expect(paid.text).toContain("We've received your payment");
    expect(paid.html).not.toContain("still pending");
  });

  it("shows the order, the totals and where it is going, but nothing meant for the shop owner", () => {
    const { html, text } = renderCustomerOrderEmail(sampleOrder(), settings, { ...context, storefrontUrl: "https://shop.example" });
    for (const expected of ["Organic Saffron Gel", "Aloe Pure Shampoo", "₹1,617.30", "WELCOME10", "Shipping &amp; billing address", "12 Temple Road", "Please deliver after 6 pm.", "Your note"]) {
      expect(html).toContain(expected);
    }
    expect(text).toContain("Aloe Pure Shampoo (200ml) x 2: ₹1,198.00");
    expect(html).not.toContain("adminecho5");
    expect(html).not.toContain("Customer</div>"); // the owner's "Customer" card is for the shop, not the customer
  });

  it("links to the customer's orders in their account, and offers the shop's contact details", () => {
    const withLinks = renderCustomerOrderEmail(sampleOrder(), settings, { ...context, storefrontUrl: "https://shop.example", contactEmail: "hello@shop.example", contactPhone: "98470 00000" });
    expect(withLinks.html).toContain("https://shop.example/my-account/orders");
    expect(withLinks.html).toContain("hello@shop.example · 98470 00000");
    expect(withLinks.text).toContain("See your orders: https://shop.example/my-account/orders");

    const bare = renderCustomerOrderEmail(sampleOrder(), settings, context);
    expect(bare.html).not.toContain("See your orders");
    expect(bare.html).not.toContain("Questions about your order");
  });

  it("uses a custom subject, heading and extra text with the placeholders filled", () => {
    const message = renderCustomerOrderEmail(sampleOrder(), { ...settings, subject: "{customer_name}, order #{order_number} is in!", heading: "We got it, {customer_name}", additionalContent: "Thanks again from {site_title}." }, context);
    expect(message.subject).toBe("Asha Nair, order #20001 is in!");
    expect(message.html).toContain("We got it, Asha Nair");
    expect(message.html).toContain("Thanks again from Bhumi Blend Organics.");
  });

  it("never lets a customer's words become HTML, or a header", () => {
    const order = sampleOrder();
    const evil = `<script>alert(1)</script>"><img src=x onerror=alert(2)>`;
    const message = renderCustomerOrderEmail(
      { ...order, note: evil, shipping: { ...order.shipping, firstName: evil }, items: [{ ...order.items[0]!, name: evil }] },
      { ...settings, subject: "Order for {customer_name}" },
      context,
    );
    expect(message.html).not.toContain("<script>");
    expect(message.html).not.toContain("<img src=x");
    expect(message.html).toContain("&lt;script&gt;");

    const injected = renderCustomerOrderEmail({ ...order, shipping: { ...order.shipping, firstName: "Asha\r\nBcc: evil@example.com" } }, { ...settings, subject: "Order for {customer_name}" }, context);
    expect(injected.subject).not.toMatch(/[\r\n]/);
  });
});

// ---- the admin screen -----------------------------------------------------------

describe("Settings → Emails (admin) with two emails", () => {
  const mail = fakeMailer();
  let ctx: Awaited<ReturnType<typeof startTestApp>>;
  let auth: { Authorization: string };
  beforeAll(async () => {
    ctx = await startTestApp({ mailer: mail.mailer, env: { ORDER_NOTIFY_EMAILS: "owner-default@example.com" } });
    auth = await adminHeader(ctx.api);
  });
  afterAll(() => ctx.stop());
  beforeEach(async () => {
    await Setting.deleteMany({});
    mail.outbox.length = 0;
  });

  it("lists both emails", async () => {
    const { body } = await ctx.api.get("/api/admin/emails").set(auth).expect(200);
    expect(body.emails).toEqual([
      { key: "new-order", title: "New order", description: expect.any(String), enabled: true, recipients: "owner-default@example.com" },
      { key: "order-received", title: "Order received", description: expect.any(String), enabled: true, recipients: "" },
    ]);
    expect((await ctx.api.get("/api/admin/emails")).status).toBe(401);
    expect((await ctx.api.get("/api/admin/emails").set(await customerHeader(ctx))).status).toBe(401);
  });

  it("starts on, with no recipient field and the default wording as placeholders", async () => {
    const { body } = await ctx.api.get("/api/admin/emails/order-received").set(auth).expect(200);
    expect(body).toMatchObject({ key: "order-received", title: "Order received", recipientsEditable: false });
    expect(body.settings).toEqual({ enabled: true, recipients: "", subject: "", heading: "", additionalContent: "", format: "html" });
    expect(body.defaults).toEqual({ recipients: "", subject: "Your {site_title} order has been received!", heading: "Thank you for your order" });
  });

  it("saves its own settings without touching the owner's email", async () => {
    await ctx.api.put("/api/admin/emails/new-order").set(auth).send({ enabled: true, recipients: "owner@example.com", subject: "", heading: "Owner heading", additionalContent: "", format: "html" }).expect(200);
    const saved = await ctx.api.put("/api/admin/emails/order-received").set(auth).send({ enabled: false, subject: "Got it", heading: "Customer heading", additionalContent: "Bye", format: "plain" }).expect(200);
    expect(saved.body.settings).toEqual({ enabled: false, recipients: "", subject: "Got it", heading: "Customer heading", additionalContent: "Bye", format: "plain" });

    expect((await ctx.api.get("/api/admin/emails/new-order").set(auth)).body.settings).toMatchObject({ enabled: true, recipients: "owner@example.com", heading: "Owner heading" });
    expect((await ctx.api.get("/api/admin/emails/order-received").set(auth)).body.settings).toMatchObject({ enabled: false, heading: "Customer heading" });
  });

  it("refuses a bad format, and ignores a recipients field the customer's email doesn't have", async () => {
    const ok = { enabled: true, subject: "", heading: "", additionalContent: "", format: "html" };
    expect((await ctx.api.put("/api/admin/emails/order-received").set(auth).send({ ...ok, format: "pdf" })).status).toBe(400);
    const saved = await ctx.api.put("/api/admin/emails/order-received").set(auth).send({ ...ok, recipients: "someone@example.com" }).expect(200);
    expect(saved.body.settings.recipients).toBe("");
  });

  it("previews the customer's email with what is typed, without saving it", async () => {
    const preview = await ctx.api.post("/api/admin/emails/order-received/preview").set(auth).send({ heading: "Fresh heading", additionalContent: "A little extra" }).expect(200);
    expect(preview.body.subject).toBe("Your Bhumi Blend Organics order has been received!");
    expect(preview.body.html).toContain("Fresh heading");
    expect(preview.body.html).toContain("Hi Asha,");
    expect(preview.body.html).toContain("A little extra");
    expect((await ctx.api.get("/api/admin/emails/order-received").set(auth)).body.settings.heading).toBe("");
  });

  it("sends a test copy to one address, marked as a test", async () => {
    await ctx.api.post("/api/admin/emails/order-received/test").set(auth).send({ to: "me@example.com", heading: "Test heading" }).expect(200);
    expect(mail.outbox).toHaveLength(1);
    expect(mail.outbox[0]).toMatchObject({ to: "me@example.com", subject: "[TEST] Your Bhumi Blend Organics order has been received!" });
    expect(mail.outbox[0]!.html).toContain("Test heading");
  });

  it("answers 404 for an email that doesn't exist", async () => {
    for (const path of ["nope", "nope/preview", "nope/test"]) {
      const response = path === "nope" ? await ctx.api.get(`/api/admin/emails/${path}`).set(auth) : await ctx.api.post(`/api/admin/emails/${path}`).set(auth).send({ to: "a@b.co" });
      expect(response.status).toBe(404);
    }
  });
});

// ---- when it is sent --------------------------------------------------------------

const cart = { items: [{ slug: "aloe-pure-shampoo", qty: 1 }], email: "buyer@example.com", shipping: validAddress };
const OWNER = "owner@example.com";

async function configure(owner: Record<string, unknown> | null, customer: Record<string, unknown> = {}) {
  await Setting.updateOne({ _id: "general" }, { $set: { ...(owner && { newOrderEmail: owner }), customerOrderEmail: customer } }, { upsert: true });
}
const to = (outbox: { to: string }[]) => outbox.map((message) => message.to);

describe("online payment not set up: both emails go out when the shopper confirms (Pay Now)", () => {
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

  it("sends the shop owner one email and the customer another, each to the right address", async () => {
    await configure({ recipients: OWNER });
    const order = await place();
    expect(mail.outbox).toHaveLength(0); // nothing for merely placing it
    await confirm(order).expect(200);

    expect(to(mail.outbox)).toEqual([OWNER, "buyer@example.com"]);
    expect(mail.outbox[0]!.subject).toBe(`[Bhumi Blend Organics]: New order #${order.number}`);
    expect(mail.outbox[1]!.subject).toBe("Your Bhumi Blend Organics order has been received!");
    expect(mail.outbox[1]!.html).toContain("Hi Asha,");
    expect(mail.outbox[1]!.html).toContain("Aloe Pure Shampoo");
    const written = await notes(order.number);
    expect(written).toContain(`New-order email sent to ${OWNER}.`);
    expect(written).toContain("Order-received email sent to buyer@example.com.");
  });

  it("sends the customer's email once, however often Pay Now is pressed", async () => {
    await configure({ recipients: OWNER });
    const order = await place();
    await confirm(order).expect(200);
    await confirm(order).expect(200);
    await Promise.all([confirm(order), confirm(order)]);
    expect(to(mail.outbox)).toEqual([OWNER, "buyer@example.com"]);
  });

  it("still emails the customer when the shop owner has no recipient, and vice versa", async () => {
    await configure(null); // no recipients anywhere
    await confirm(await place()).expect(200);
    expect(to(mail.outbox)).toEqual(["buyer@example.com"]);

    mail.outbox.length = 0;
    await configure({ recipients: OWNER }, { enabled: false });
    await confirm(await place()).expect(200);
    expect(to(mail.outbox)).toEqual([OWNER]);
  });

  it("sends nothing to the customer when their email is switched off", async () => {
    await configure(null, { enabled: false });
    await confirm(await place()).expect(200);
    expect(mail.outbox).toHaveLength(0);
  });

  it("does not let one email's failure stop the other, and writes it on the order", async () => {
    await configure({ recipients: OWNER });
    const order = await place();
    mail.failNext(); // the owner's email is sent first, so it is the one that fails
    await confirm(order).expect(200);
    expect(to(mail.outbox)).toEqual(["buyer@example.com"]); // the customer still got theirs
    let written = await notes(order.number);
    expect(written).toContain(`The new-order email could not be sent to ${OWNER}.`);
    expect(written).toContain("Order-received email sent to buyer@example.com.");

    await confirm(order).expect(200); // pressing again retries only what failed
    expect(to(mail.outbox)).toEqual(["buyer@example.com", OWNER]);
    written = await notes(order.number);
    expect(written.filter((text) => text.startsWith("Order-received email sent"))).toHaveLength(1);
  });

  it("retries the customer's email after a failure without bothering the owner again", async () => {
    await configure(null);
    const order = await place();
    mail.failNext();
    await confirm(order).expect(200);
    expect(mail.outbox).toHaveLength(0);
    expect(await notes(order.number)).toContain("The order-received email could not be sent to buyer@example.com.");
    expect((await Order.findOne({ number: order.number }))?.customerEmailSentAt).toBeUndefined();

    await confirm(order).expect(200);
    expect(to(mail.outbox)).toEqual(["buyer@example.com"]);
  });

  it("sends the customer's email as plain text when the admin chose that", async () => {
    await configure(null, { format: "plain" });
    await confirm(await place()).expect(200);
    expect(mail.outbox[0]!.html).toBeUndefined();
    expect(mail.outbox[0]!.text).toContain("Hi Asha,");
  });

  it("emails nobody for an order that was cancelled", async () => {
    await configure({ recipients: OWNER });
    const order = await place();
    await ctx.api.post(`/api/orders/${order.number}/cancel`).set(order.header).expect(200);
    await confirm(order).expect(409);
    expect(mail.outbox).toHaveLength(0);
  });
});

describe("online payment set up: both emails go out when the payment goes through", () => {
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
    await configure({ recipients: OWNER });
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

  it("sends neither for an order that is only placed, not paid", async () => {
    await place();
    expect(mail.outbox).toHaveLength(0);
  });

  it("sends both when the payment is verified, telling the customer it is paid, and not again on a replay", async () => {
    const order = await place();
    await verify(order).expect(200);
    expect(to(mail.outbox)).toEqual([OWNER, "buyer@example.com"]);
    expect(mail.outbox[1]!.text).toContain("We've received your payment");
    await verify(order).expect(200);
    expect(mail.outbox).toHaveLength(2);
  });

  it("sends each once when Razorpay's webhook and the browser both report the payment", async () => {
    const order = await place();
    const total = (await Order.findOne({ number: order.number }))!.total;
    const raw = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1", order_id: order.rzp, amount: Math.round(total * 100) } } } });
    await ctx.api.post("/api/webhooks/razorpay").set("Content-Type", "application/json").set("X-Razorpay-Signature", webhookSignature(raw)).send(raw).expect(200);
    expect(to(mail.outbox)).toEqual([OWNER, "buyer@example.com"]);
    await verify(order).expect(200);
    expect(mail.outbox).toHaveLength(2);
  });
});
