import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Coupon } from "../src/models/Coupon.js";
import { Order } from "../src/models/Order.js";
import { Product } from "../src/models/Product.js";
import { fakeGateway, paymentSignature, startTestApp, validAddress, webhookSignature } from "./helpers.js";

const SAFFRON = "saffron-face-cream-for-glowing-skin"; // ₹599, was ₹1,200
const OIL = "best-ayurvedic-hair-oil"; // ₹399, was ₹499

const gateway = fakeGateway();
let ctx: Awaited<ReturnType<typeof startTestApp>>;
beforeAll(async () => {
  ctx = await startTestApp({ payments: gateway.gateway });
});
afterAll(() => ctx.stop());
beforeEach(async () => {
  await Order.deleteMany({});
  await Coupon.deleteMany({});
  await Product.updateMany({}, { inStock: true, isActive: true });
  gateway.created.length = 0;
});

const body = (extra: Record<string, unknown> = {}) => ({
  items: [{ slug: SAFFRON, qty: 2 }],
  email: "Shopper@Example.com",
  shipping: validAddress,
  ...extra,
});

async function place(extra: Record<string, unknown> = {}) {
  const response = await ctx.api.post("/api/orders").send(body(extra));
  return response;
}
const tokenHeader = (token: string) => ({ "X-Order-Token": token });

describe("placing an order", () => {
  it("prices the cart from the database and starts a Razorpay payment", async () => {
    const response = await place().then((r) => {
      expect(r.status).toBe(201);
      return r.body;
    });

    expect(response.order).toMatchObject({
      number: 20001,
      email: "shopper@example.com",
      subtotal: 1198,
      discountTotal: 0,
      shippingTotal: 0,
      total: 1198,
      paymentStatus: "pending",
      fulfilmentStatus: "new",
      billingSameAsShipping: true,
    });
    expect(response.order.items).toEqual([
      expect.objectContaining({ slug: SAFFRON, name: "Organic Saffron Gel", unitPrice: 599, regularPrice: 1200, qty: 2, lineTotal: 1198, size: "100g" }),
    ]);
    expect(response.order.shipping.phone).toBe("9876543210");
    expect(response.order.billing).toEqual(response.order.shipping);

    expect(response.payment).toMatchObject({
      provider: "razorpay",
      keyId: "rzp_test_key",
      razorpayOrderId: "order_test_1",
      amountPaise: 119_800,
      currency: "INR",
      prefill: { name: "Asha Nair", email: "shopper@example.com", contact: "9876543210" },
    });
    expect(gateway.created[0]).toMatchObject({ amountPaise: 119_800, receipt: "BB-20001" });
    expect(typeof response.accessToken).toBe("string");
    // The token's hash must never leave the server.
    expect(JSON.stringify(response)).not.toContain("accessTokenHash");
  });

  it("numbers orders one after another", async () => {
    const first = (await place()).body.order.number;
    const second = (await place()).body.order.number;
    expect(second).toBe(first + 1);
  });

  it("ignores any price or total the browser sends", async () => {
    const response = await place({ items: [{ slug: SAFFRON, qty: 1, price: 1, unitPrice: 1 }], total: 1, subtotal: 1 });
    expect(response.status).toBe(201);
    expect(response.body.order.total).toBe(599);
    expect(response.body.payment.amountPaise).toBe(59_900);
  });

  it("merges the same product listed twice", async () => {
    const response = await place({ items: [{ slug: OIL, qty: 1 }, { slug: OIL, qty: 2 }] });
    expect(response.body.order.items).toHaveLength(1);
    expect(response.body.order.items[0].qty).toBe(3);
    expect(response.body.order.total).toBe(1197);
  });

  it("keeps a separate billing address when asked", async () => {
    const billing = { ...validAddress, firstName: "Ravi", city: "Pune", state: "Maharashtra", pin: "411001" };
    const response = await place({ billingSameAsShipping: false, billing });
    expect(response.status).toBe(201);
    expect(response.body.order.billing).toMatchObject({ firstName: "Ravi", city: "Pune" });
    expect(response.body.order.shipping.firstName).toBe("Asha");
  });

  it("reports every mistake in the details at once", async () => {
    const response = await place({
      email: "not-an-email",
      shipping: { ...validAddress, pin: "123", phone: "12", state: "Atlantis", firstName: "" },
    });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    const paths = response.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(["email", "shipping.pin", "shipping.phone", "shipping.state", "shipping.firstName"]));
    expect(await Order.countDocuments()).toBe(0);
  });

  it("requires a billing address when it differs", async () => {
    const response = await place({ billingSameAsShipping: false });
    expect(response.status).toBe(400);
    expect(response.body.error.details[0].path).toBe("billing");
  });

  it.each([
    ["an empty cart", { items: [] }, "VALIDATION_ERROR"],
    ["more than 10 of one product", { items: [{ slug: SAFFRON, qty: 11 }] }, "VALIDATION_ERROR"],
    ["more than 10 across duplicate lines", { items: [{ slug: SAFFRON, qty: 6 }, { slug: SAFFRON, qty: 6 }] }, "QTY_TOO_HIGH"],
    ["a product that doesn't exist", { items: [{ slug: "nope", qty: 1 }] }, "PRODUCT_UNAVAILABLE"],
    ["a fractional quantity", { items: [{ slug: SAFFRON, qty: 1.5 }] }, "VALIDATION_ERROR"],
  ])("rejects %s", async (_label, extra, code) => {
    const response = await place(extra);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe(code);
  });

  it("rejects hidden and out-of-stock products", async () => {
    await Product.updateOne({ slug: SAFFRON }, { isActive: false });
    expect((await place()).body.error.code).toBe("PRODUCT_UNAVAILABLE");
    await Product.updateOne({ slug: SAFFRON }, { isActive: true, inStock: false });
    const response = await place();
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("OUT_OF_STOCK");
  });
});

describe("coupons", () => {
  const make = (extra: Record<string, unknown>) =>
    Coupon.create({ code: "SAVE10", type: "percent", value: 10, ...extra });

  it("takes a percentage off, up to the cap", async () => {
    await make({ maxDiscount: 100 });
    const response = await place({ couponCode: "save10" });
    expect(response.status).toBe(201);
    expect(response.body.order).toMatchObject({ subtotal: 1198, discountTotal: 100, total: 1098, coupon: { code: "SAVE10", discount: 100 } });
    expect(response.body.payment.amountPaise).toBe(109_800);
  });

  it("takes a fixed amount off", async () => {
    await make({ type: "fixed", value: 150 });
    const response = await place({ couponCode: "SAVE10" });
    expect(response.body.order.total).toBe(1048);
  });

  it("previews the discount for the checkout page", async () => {
    await make({});
    const response = await ctx.api.post("/api/coupons/validate").send({ code: "Save10", items: [{ slug: SAFFRON, qty: 2 }] }).expect(200);
    expect(response.body).toMatchObject({ code: "SAVE10", subtotal: 1198, discount: 119.8, total: 1078.2 });
  });

  it.each([
    ["an unknown code", {}, "NOPE", "COUPON_INVALID"],
    ["a switched-off coupon", { isActive: false }, "SAVE10", "COUPON_INVALID"],
    ["an expired coupon", { expiresAt: new Date(Date.now() - 86_400_000) }, "SAVE10", "COUPON_EXPIRED"],
    ["one that hasn't started", { startsAt: new Date(Date.now() + 86_400_000) }, "SAVE10", "COUPON_NOT_STARTED"],
    ["a used-up coupon", { usageLimit: 1, usedCount: 1 }, "SAVE10", "COUPON_USED_UP"],
    ["a cart below the minimum", { minSubtotal: 5000 }, "SAVE10", "COUPON_MIN_SUBTOTAL"],
  ])("refuses %s", async (_label, extra, code, errorCode) => {
    await make(extra);
    const response = await place({ couponCode: code });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe(errorCode);
    expect(await Order.countDocuments()).toBe(0);
  });

  it("won't let a coupon make the order free", async () => {
    await make({ type: "fixed", value: 5000 });
    const response = await place({ couponCode: "SAVE10" });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("TOTAL_TOO_LOW");
  });
});

describe("looking at an order", () => {
  it("needs the order's own token", async () => {
    const placed = (await place()).body;
    const other = (await place()).body;
    const url = `/api/orders/${placed.order.number}`;

    const ok = await ctx.api.get(url).set(tokenHeader(placed.accessToken)).expect(200);
    expect(ok.body.order.number).toBe(placed.order.number);

    await ctx.api.get(url).expect(404);
    await ctx.api.get(url).set(tokenHeader("wrong")).expect(404);
    await ctx.api.get(url).set(tokenHeader(other.accessToken)).expect(404);
    await ctx.api.get("/api/orders/abc").set(tokenHeader(placed.accessToken)).expect(404);
  });

  it("gives the payment details again for a pending order", async () => {
    const placed = (await place()).body;
    const response = await ctx.api.post(`/api/orders/${placed.order.number}/payment`).set(tokenHeader(placed.accessToken)).expect(200);
    expect(response.body.payment.razorpayOrderId).toBe("order_test_1");
    expect(response.body.payment.amountPaise).toBe(119_800);
  });
});

describe("confirming a payment from the browser", () => {
  it("accepts a genuine signature and marks the order paid", async () => {
    const placed = (await place()).body;
    const rzpOrder = placed.payment.razorpayOrderId as string;
    const response = await ctx.api
      .post(`/api/orders/${placed.order.number}/verify-payment`)
      .set(tokenHeader(placed.accessToken))
      .send({ razorpay_order_id: rzpOrder, razorpay_payment_id: "pay_abc", razorpay_signature: paymentSignature(rzpOrder, "pay_abc") })
      .expect(200);
    expect(response.body.order.paymentStatus).toBe("paid");
    expect(response.body.order.paidAt).toBeTruthy();
    const stored = await Order.findOne({ number: placed.order.number });
    expect(stored?.payment?.razorpayPaymentId).toBe("pay_abc");
  });

  it("refuses a forged signature and leaves the order unpaid", async () => {
    const placed = (await place()).body;
    const rzpOrder = placed.payment.razorpayOrderId as string;
    const response = await ctx.api
      .post(`/api/orders/${placed.order.number}/verify-payment`)
      .set(tokenHeader(placed.accessToken))
      .send({ razorpay_order_id: rzpOrder, razorpay_payment_id: "pay_abc", razorpay_signature: "0".repeat(64) });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_SIGNATURE");
    expect((await Order.findOne({ number: placed.order.number }))?.paymentStatus).toBe("pending");
  });

  it("refuses a payment that belongs to a different Razorpay order", async () => {
    const placed = (await place()).body;
    const response = await ctx.api
      .post(`/api/orders/${placed.order.number}/verify-payment`)
      .set(tokenHeader(placed.accessToken))
      .send({ razorpay_order_id: "order_other", razorpay_payment_id: "pay_abc", razorpay_signature: paymentSignature("order_other", "pay_abc") });
    expect(response.body.error.code).toBe("PAYMENT_MISMATCH");
  });

  it("needs the token, and can be repeated without double-counting a coupon", async () => {
    await Coupon.create({ code: "ONCE", type: "fixed", value: 50, usageLimit: 5 });
    const placed = (await place({ couponCode: "ONCE" })).body;
    const rzpOrder = placed.payment.razorpayOrderId as string;
    const verify = { razorpay_order_id: rzpOrder, razorpay_payment_id: "pay_abc", razorpay_signature: paymentSignature(rzpOrder, "pay_abc") };
    const url = `/api/orders/${placed.order.number}/verify-payment`;

    await ctx.api.post(url).send(verify).expect(404);
    await ctx.api.post(url).set(tokenHeader(placed.accessToken)).send(verify).expect(200);
    await ctx.api.post(url).set(tokenHeader(placed.accessToken)).send(verify).expect(200);
    expect((await Coupon.findOne({ code: "ONCE" }))?.usedCount).toBe(1);
  });

  it("stops offering payment once paid", async () => {
    const placed = (await place()).body;
    const rzpOrder = placed.payment.razorpayOrderId as string;
    await ctx.api
      .post(`/api/orders/${placed.order.number}/verify-payment`)
      .set(tokenHeader(placed.accessToken))
      .send({ razorpay_order_id: rzpOrder, razorpay_payment_id: "pay_1", razorpay_signature: paymentSignature(rzpOrder, "pay_1") })
      .expect(200);
    const again = await ctx.api.post(`/api/orders/${placed.order.number}/payment`).set(tokenHeader(placed.accessToken));
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe("ORDER_NOT_PAYABLE");
  });
});

describe("Razorpay webhook", () => {
  const send = (payload: object, signature?: string) => {
    const raw = JSON.stringify(payload);
    return ctx.api
      .post("/api/webhooks/razorpay")
      .set("Content-Type", "application/json")
      .set("X-Razorpay-Signature", signature ?? webhookSignature(raw))
      .send(raw);
  };
  const captured = (rzpOrderId: string, amount: number, id = "pay_hook") => ({
    event: "payment.captured",
    payload: { payment: { entity: { id, order_id: rzpOrderId, amount } } },
  });

  it("rejects calls with a wrong or missing signature", async () => {
    const placed = (await place()).body;
    const payload = captured(placed.payment.razorpayOrderId, 119_800);
    expect((await send(payload, "f".repeat(64))).status).toBe(400);
    const unsigned = await ctx.api.post("/api/webhooks/razorpay").set("Content-Type", "application/json").send(JSON.stringify(payload));
    expect(unsigned.status).toBe(400);
    expect((await Order.findOne({ number: placed.order.number }))?.paymentStatus).toBe("pending");
  });

  it("marks the order paid when a payment is captured", async () => {
    const placed = (await place()).body;
    const response = await send(captured(placed.payment.razorpayOrderId, 119_800));
    expect(response.status).toBe(200);
    const stored = await Order.findOne({ number: placed.order.number });
    expect(stored?.paymentStatus).toBe("paid");
    expect(stored?.payment?.razorpayPaymentId).toBe("pay_hook");
  });

  it("ignores a payment for the wrong amount", async () => {
    const placed = (await place()).body;
    await send(captured(placed.payment.razorpayOrderId, 100));
    expect((await Order.findOne({ number: placed.order.number }))?.paymentStatus).toBe("pending");
  });

  it("handles order.paid and counts a coupon once even if the browser also confirmed", async () => {
    await Coupon.create({ code: "ONCE", type: "fixed", value: 50 });
    const placed = (await place({ couponCode: "ONCE" })).body;
    const rzpOrder = placed.payment.razorpayOrderId as string;
    const amount = 114_800;

    await ctx.api
      .post(`/api/orders/${placed.order.number}/verify-payment`)
      .set(tokenHeader(placed.accessToken))
      .send({ razorpay_order_id: rzpOrder, razorpay_payment_id: "pay_hook", razorpay_signature: paymentSignature(rzpOrder, "pay_hook") })
      .expect(200);
    await send({ event: "order.paid", payload: { payment: { entity: { id: "pay_hook", order_id: rzpOrder, amount } }, order: { entity: { id: rzpOrder } } } });
    await send(captured(rzpOrder, amount));

    expect((await Coupon.findOne({ code: "ONCE" }))?.usedCount).toBe(1);
  });

  it("notes a failed payment without cancelling the order", async () => {
    const placed = (await place()).body;
    await send({ event: "payment.failed", payload: { payment: { entity: { id: "pay_bad", order_id: placed.payment.razorpayOrderId, amount: 119_800, error_description: "Card declined" } } } });
    const stored = await Order.findOne({ number: placed.order.number });
    expect(stored?.paymentStatus).toBe("pending");
    expect(stored?.payment?.lastError).toBe("Card declined");
  });

  it("answers 200 for events and orders it doesn't know", async () => {
    expect((await send({ event: "payment.captured", payload: { payment: { entity: { id: "pay_x", order_id: "order_unknown", amount: 1 } } } })).status).toBe(200);
    expect((await send({ event: "refund.created", payload: {} })).status).toBe(200);
  });

  it("brings a cancelled order back when the money still arrives", async () => {
    const placed = (await place()).body;
    await ctx.api.post(`/api/orders/${placed.order.number}/cancel`).set(tokenHeader(placed.accessToken)).expect(200);
    await send(captured(placed.payment.razorpayOrderId, 119_800));
    const stored = await Order.findOne({ number: placed.order.number });
    expect(stored).toMatchObject({ paymentStatus: "paid", fulfilmentStatus: "new" });
  });
});

describe("cancelling an order", () => {
  it("cancels an unpaid order (and stops it being payable)", async () => {
    const placed = (await place()).body;
    const url = `/api/orders/${placed.order.number}`;
    const response = await ctx.api.post(`${url}/cancel`).set(tokenHeader(placed.accessToken)).expect(200);
    expect(response.body.order.fulfilmentStatus).toBe("cancelled");
    await ctx.api.post(`${url}/cancel`).set(tokenHeader(placed.accessToken)).expect(200); // repeating is harmless
    const pay = await ctx.api.post(`${url}/payment`).set(tokenHeader(placed.accessToken));
    expect(pay.status).toBe(409);
  });

  it("won't cancel a paid order", async () => {
    const placed = (await place()).body;
    const rzpOrder = placed.payment.razorpayOrderId as string;
    await ctx.api
      .post(`/api/orders/${placed.order.number}/verify-payment`)
      .set(tokenHeader(placed.accessToken))
      .send({ razorpay_order_id: rzpOrder, razorpay_payment_id: "pay_1", razorpay_signature: paymentSignature(rzpOrder, "pay_1") })
      .expect(200);
    const response = await ctx.api.post(`/api/orders/${placed.order.number}/cancel`).set(tokenHeader(placed.accessToken));
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("ORDER_NOT_CANCELLABLE");
  });
});
