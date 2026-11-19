import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Coupon } from "../src/models/Coupon.js";
import { Order } from "../src/models/Order.js";
import { Product } from "../src/models/Product.js";
import { adminHeader, customerHeader, fakeGateway, paymentSignature, startTestApp, validAddress } from "./helpers.js";

const gateway = fakeGateway();
let ctx: Awaited<ReturnType<typeof startTestApp>>;
let auth: { Authorization: string };

beforeAll(async () => {
  ctx = await startTestApp({ payments: gateway.gateway });
  auth = await adminHeader(ctx.api);
});
afterAll(() => ctx.stop());
beforeEach(async () => {
  await Order.deleteMany({});
  await Coupon.deleteMany({});
  await Product.updateMany({}, { $unset: { stockQuantity: "" }, $set: { inStock: true, isActive: true } });
});

type Placed = { number: number; token: string; razorpayOrderId: string };

async function place(options: { slug?: string; qty?: number; shipping?: Partial<typeof validAddress>; email?: string } = {}): Promise<Placed> {
  const response = await ctx.api.post("/api/orders").set(await customerHeader(ctx)).send({
    items: [{ slug: options.slug ?? "aloe-pure-shampoo", qty: options.qty ?? 1 }],
    email: options.email ?? "buyer@example.com",
    shipping: { ...validAddress, ...options.shipping },
  });
  expect(response.status).toBe(201);
  return { number: response.body.order.number, token: response.body.accessToken, razorpayOrderId: response.body.payment.razorpayOrderId };
}

async function pay(order: Placed) {
  await ctx.api
    .post(`/api/orders/${order.number}/verify-payment`)
    .set("X-Order-Token", order.token)
    .send({ razorpay_order_id: order.razorpayOrderId, razorpay_payment_id: `pay_${order.number}`, razorpay_signature: paymentSignature(order.razorpayOrderId, `pay_${order.number}`) })
    .expect(200);
}

const patch = (number: number, body: object) => ctx.api.patch(`/api/admin/orders/${number}`).set(auth).send(body);
const detail = async (number: number) => (await ctx.api.get(`/api/admin/orders/${number}`).set(auth).expect(200)).body.order;

describe("order status tabs", () => {
  it("works out one WooCommerce-style status per order, and counts each", async () => {
    const pending = await place();
    const failed = await place();
    await Order.updateOne({ number: failed.number }, { $set: { "payment.lastError": "Card declined" } });
    const processing = await place();
    await pay(processing);
    const shipped = await place();
    await pay(shipped);
    await patch(shipped.number, { status: "shipped" }).expect(200);
    const completed = await place();
    await pay(completed);
    await patch(completed.number, { status: "completed" }).expect(200);
    const cancelled = await place();
    await ctx.api.post(`/api/orders/${cancelled.number}/cancel`).set("X-Order-Token", cancelled.token).expect(200);
    const refunded = await place();
    await pay(refunded);
    await patch(refunded.number, { status: "refunded" }).expect(200);

    const all = (await ctx.api.get("/api/admin/orders").set(auth).expect(200)).body;
    expect(all.counts).toEqual({ all: 7, pending: 1, failed: 1, processing: 1, shipped: 1, completed: 1, cancelled: 1, refunded: 1 });
    expect(all.total).toBe(7);

    const byStatus = async (status: string) =>
      (await ctx.api.get(`/api/admin/orders?status=${status}`).set(auth).expect(200)).body.items.map((o: { number: number }) => o.number);
    expect(await byStatus("pending")).toEqual([pending.number]);
    expect(await byStatus("failed")).toEqual([failed.number]);
    expect(await byStatus("processing")).toEqual([processing.number]);
    expect(await byStatus("shipped")).toEqual([shipped.number]);
    expect(await byStatus("completed")).toEqual([completed.number]);
    expect(await byStatus("cancelled")).toEqual([cancelled.number]);
    expect(await byStatus("refunded")).toEqual([refunded.number]);

    // the tab numbers don't change when another filter is on
    const filtered = (await ctx.api.get("/api/admin/orders?status=shipped&search=nobody").set(auth).expect(200)).body;
    expect(filtered.total).toBe(0);
    expect(filtered.counts.all).toBe(7);
  });

  it("gives the table what it needs for each row", async () => {
    const order = await place({ slug: "buy-pure-aloe-vera-gel", qty: 3, shipping: { firstName: "Meera", lastName: "Iyer" } });
    const { items } = (await ctx.api.get("/api/admin/orders").set(auth).expect(200)).body;
    expect(items[0]).toMatchObject({
      number: order.number,
      status: "pending",
      total: 750,
      currency: "INR",
      customerName: "Meera Iyer",
      email: "buyer@example.com",
      itemCount: 3,
      items: [{ name: "Original Aloe Vera Gel", qty: 3 }],
    });
    expect(items[0].createdAt).toBeTruthy();
  });
});

describe("finding orders", () => {
  it("searches by number, email and name", async () => {
    const asha = await place({ email: "asha@example.com", shipping: { firstName: "Asha", lastName: "Nair" } });
    await place({ email: "ravi@example.com", shipping: { firstName: "Ravi", lastName: "Menon" } });
    const found = async (term: string) =>
      (await ctx.api.get(`/api/admin/orders?search=${encodeURIComponent(term)}`).set(auth).expect(200)).body.items.map((o: { number: number }) => o.number);

    expect(await found(`#${asha.number}`)).toEqual([asha.number]);
    expect(await found(String(asha.number))).toEqual([asha.number]);
    expect(await found("ASHA@")).toEqual([asha.number]);
    expect(await found("menon")).toHaveLength(1);
    expect(await found("nobody")).toEqual([]);
    expect(await found("(((")).toEqual([]); // regex characters are harmless
  });

  it("filters by date (Indian days) and by customer", async () => {
    const early = await place();
    const late = await place();
    // Indian days, not UTC days: 18:00Z is 23:30 IST on the 10th; 19:00Z the next day is 00:30 IST on the 12th.
    await Order.collection.updateOne({ number: early.number }, { $set: { createdAt: new Date("2026-03-10T18:00:00Z") } });
    await Order.collection.updateOne({ number: late.number }, { $set: { createdAt: new Date("2026-03-11T19:00:00Z") } }); // = 00:30 IST on the 12th

    const between = async (from: string, to: string) =>
      (await ctx.api.get(`/api/admin/orders?from=${from}&to=${to}`).set(auth).expect(200)).body.items.map((o: { number: number }) => o.number);
    expect(await between("2026-03-10", "2026-03-10")).toEqual([early.number]);
    expect(await between("2026-03-11", "2026-03-11")).toEqual([]);
    expect(await between("2026-03-12", "2026-03-12")).toEqual([late.number]);
    expect(await between("2026-03-10", "2026-03-12")).toHaveLength(2);
    expect((await ctx.api.get("/api/admin/orders?from=nonsense").set(auth)).status).toBe(400);

    const someone = "64b64b64b64b64b64b64b64b";
    expect((await ctx.api.get(`/api/admin/orders?customer=${someone}`).set(auth).expect(200)).body.total).toBe(0);
    expect((await ctx.api.get("/api/admin/orders?customer=not-an-id").set(auth)).status).toBe(400);
  });

  it("sorts and pages", async () => {
    await place({ slug: "buy-pure-aloe-vera-gel", qty: 2 }); // 500
    await place({ slug: "aloe-pure-shampoo", qty: 1 }); // 599
    await place({ slug: "buy-pure-aloe-vera-gel", qty: 1 }); // 250
    const totals = async (query: string) =>
      (await ctx.api.get(`/api/admin/orders?${query}`).set(auth).expect(200)).body.items.map((o: { total: number }) => o.total);
    expect(await totals("sort=total&dir=asc")).toEqual([250, 500, 599]);
    expect(await totals("sort=total&dir=desc")).toEqual([599, 500, 250]);
    expect(await totals("sort=total&dir=asc&limit=2&page=2")).toEqual([599]);
  });
});

describe("one order", () => {
  it("shows its status, notes and who it belongs to", async () => {
    const order = await place();
    await pay(order);
    const shown = await detail(order.number);
    expect(shown).toMatchObject({ number: order.number, status: "processing", paymentStatus: "paid", stockReduced: true });
    expect(shown.notes[0]).toMatchObject({ author: "System", customerNote: false });
    expect(shown.notes[0].text).toContain("Payment received through Razorpay");
    expect(shown.payment.razorpayPaymentId).toBe(`pay_${order.number}`);
    expect((await ctx.api.get("/api/admin/orders/999999").set(auth)).status).toBe(404);
  });
});

describe("changing an order's status", () => {
  it("ships with tracking, then completes — and the shopper sees it", async () => {
    const order = await place();
    await pay(order);

    const shipped = await patch(order.number, { status: "shipped", tracking: { carrier: "India Post", trackingNumber: "EE123456789IN" } }).expect(200);
    expect(shipped.body.order).toMatchObject({ status: "shipped", fulfilmentStatus: "shipped", tracking: { carrier: "India Post", trackingNumber: "EE123456789IN" } });
    expect(shipped.body.order.tracking.shippedAt).toBeTruthy();
    const texts = shipped.body.order.notes.map((n: { text: string }) => n.text);
    expect(texts.some((t: string) => t.includes("Tracking added: India Post · EE123456789IN"))).toBe(true);
    expect(texts.some((t: string) => t.includes("changed from Processing to Shipped"))).toBe(true);
    expect(shipped.body.order.notes.at(-1).author).toBe("Boss");

    const mine = await ctx.api.get(`/api/orders/${order.number}`).set("X-Order-Token", order.token).expect(200);
    expect(mine.body.order).toMatchObject({ status: "shipped", tracking: { trackingNumber: "EE123456789IN" } });

    const done = await patch(order.number, { status: "completed" }).expect(200);
    expect(done.body.order).toMatchObject({ status: "completed", fulfilmentStatus: "delivered" });
  });

  it("can add tracking without changing the status", async () => {
    const order = await place();
    await pay(order);
    const response = await patch(order.number, { tracking: { trackingNumber: "TRK1" } }).expect(200);
    expect(response.body.order.status).toBe("processing");
    expect(response.body.order.tracking.trackingNumber).toBe("TRK1");
  });

  it("refuses changes that don't make sense", async () => {
    const unpaid = await place();
    for (const status of ["processing", "shipped", "completed", "refunded"]) {
      const response = await patch(unpaid.number, { status });
      expect(response.status, status).toBe(409);
      expect(response.body.error.code).toBe("INVALID_STATUS_CHANGE");
    }
    // but an unpaid order can be cancelled
    expect((await patch(unpaid.number, { status: "cancelled" })).body.order.status).toBe("cancelled");
    // and a cancelled one is final
    expect((await patch(unpaid.number, { status: "processing" })).status).toBe(409);

    const paid = await place();
    await pay(paid);
    await patch(paid.number, { status: "refunded" }).expect(200);
    expect((await patch(paid.number, { status: "shipped" })).status).toBe(409);
    expect((await patch(paid.number, { status: "cancelled" })).status).toBe(409);

    expect((await patch(paid.number, { status: "pending" })).status).toBe(400); // not something an admin can set
    expect((await patch(paid.number, {})).status).toBe(400);
  });

  it("treats setting the status it already has as a harmless no-op", async () => {
    const order = await place();
    await pay(order);
    const before = (await detail(order.number)).notes.length;
    await patch(order.number, { status: "processing" }).expect(200);
    expect((await detail(order.number)).notes).toHaveLength(before);
  });
});

describe("stock", () => {
  const stockOf = async (slug: string) => (await Product.findOne({ slug }).lean())!;

  it("comes off the shelf when an order is paid, and the product sells out at zero", async () => {
    await Product.updateOne({ slug: "aloe-pure-shampoo" }, { stockQuantity: 5 });
    const first = await place({ qty: 2 });
    expect((await stockOf("aloe-pure-shampoo")).stockQuantity).toBe(5); // not until it's paid
    await pay(first);
    expect(await stockOf("aloe-pure-shampoo")).toMatchObject({ stockQuantity: 3, inStock: true });

    const second = await place({ qty: 3 });
    await pay(second);
    expect(await stockOf("aloe-pure-shampoo")).toMatchObject({ stockQuantity: 0, inStock: false });

    const sold = await ctx.api.post("/api/orders").set(await customerHeader(ctx)).send({ items: [{ slug: "aloe-pure-shampoo", qty: 1 }], email: "a@b.co", shipping: validAddress });
    expect(sold.status).toBe(409);
    expect(sold.body.error.code).toBe("OUT_OF_STOCK");
  });

  it("refuses an order for more than is left", async () => {
    await Product.updateOne({ slug: "aloe-pure-shampoo" }, { stockQuantity: 2 });
    const response = await ctx.api.post("/api/orders").set(await customerHeader(ctx)).send({ items: [{ slug: "aloe-pure-shampoo", qty: 3 }], email: "a@b.co", shipping: validAddress });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("INSUFFICIENT_STOCK");
    expect(response.body.error.message).toContain("Only 2 of Aloe Pure Shampoo are left");
    await place({ qty: 2 }); // exactly what is left is fine
  });

  it("goes back on the shelf when the admin cancels a paid order — once", async () => {
    await Product.updateOne({ slug: "aloe-pure-shampoo" }, { stockQuantity: 5 });
    const order = await place({ qty: 2 });
    await pay(order);
    expect((await stockOf("aloe-pure-shampoo")).stockQuantity).toBe(3);

    await patch(order.number, { status: "cancelled" }).expect(200);
    expect(await stockOf("aloe-pure-shampoo")).toMatchObject({ stockQuantity: 5, inStock: true });
    expect((await detail(order.number)).stockReduced).toBe(false);
    await patch(order.number, { status: "cancelled" }).expect(200); // again: nothing more to give back
    expect((await stockOf("aloe-pure-shampoo")).stockQuantity).toBe(5);
  });

  it("goes back on the shelf for a refund too, and brings a sold-out product back", async () => {
    await Product.updateOne({ slug: "aloe-pure-shampoo" }, { stockQuantity: 1 });
    const order = await place({ qty: 1 });
    await pay(order);
    expect(await stockOf("aloe-pure-shampoo")).toMatchObject({ stockQuantity: 0, inStock: false });
    await patch(order.number, { status: "refunded" }).expect(200);
    expect(await stockOf("aloe-pure-shampoo")).toMatchObject({ stockQuantity: 1, inStock: true });
  });

  it("leaves products without a stock count alone", async () => {
    const order = await place({ qty: 4 });
    await pay(order);
    const product = await stockOf("aloe-pure-shampoo");
    expect(product.stockQuantity).toBeUndefined();
    expect(product.inStock).toBe(true);
  });

  it("is only taken once when the browser and the webhook both report the payment", async () => {
    await Product.updateOne({ slug: "aloe-pure-shampoo" }, { stockQuantity: 10 });
    const order = await place({ qty: 2 });
    await pay(order);
    await pay(order); // a second confirmation of the same payment
    expect((await stockOf("aloe-pure-shampoo")).stockQuantity).toBe(8);
  });
});

describe("order notes", () => {
  it("keeps private notes private and shows customer notes to the shopper", async () => {
    const order = await place();
    const added = await ctx.api.post(`/api/admin/orders/${order.number}/notes`).set(auth).send({ text: "Packed with extra care", customerNote: false }).expect(201);
    await ctx.api.post(`/api/admin/orders/${order.number}/notes`).set(auth).send({ text: "Your parcel leaves tomorrow!", customerNote: true }).expect(201);
    expect(added.body.order.notes.at(-1)).toMatchObject({ text: "Packed with extra care", author: "Boss", customerNote: false });

    const mine = await ctx.api.get(`/api/orders/${order.number}`).set("X-Order-Token", order.token).expect(200);
    expect(mine.body.order.customerNotes.map((n: { text: string }) => n.text)).toEqual(["Your parcel leaves tomorrow!"]);
    expect(JSON.stringify(mine.body)).not.toContain("Packed with extra care");
  });

  it("deletes a note, and rejects empty or unknown ones", async () => {
    const order = await place();
    const created = await ctx.api.post(`/api/admin/orders/${order.number}/notes`).set(auth).send({ text: "temp" }).expect(201);
    const noteId = created.body.order.notes.at(-1).id as string;
    const removed = await ctx.api.delete(`/api/admin/orders/${order.number}/notes/${noteId}`).set(auth).expect(200);
    expect(removed.body.order.notes.some((n: { id: string }) => n.id === noteId)).toBe(false);
    expect((await ctx.api.delete(`/api/admin/orders/${order.number}/notes/${noteId}`).set(auth)).status).toBe(404);
    expect((await ctx.api.post(`/api/admin/orders/${order.number}/notes`).set(auth).send({ text: "   " })).status).toBe(400);
  });
});

describe("bulk actions", () => {
  it("changes several orders and reports the ones it couldn't", async () => {
    const a = await place();
    await pay(a);
    const b = await place();
    await pay(b);
    const unpaid = await place();

    const response = await ctx.api.post("/api/admin/orders/bulk").set(auth).send({ numbers: [a.number, b.number, unpaid.number, 999999], status: "completed" }).expect(200);
    expect(response.body.updated).toBe(2);
    expect(response.body.skipped).toEqual(
      expect.arrayContaining([
        { number: unpaid.number, reason: expect.stringContaining("hasn't been paid") },
        { number: 999999, reason: "Order not found." },
      ]),
    );
    expect((await detail(a.number)).status).toBe("completed");
    expect((await detail(b.number)).status).toBe("completed");
    expect((await detail(unpaid.number)).status).toBe("pending");
  });

  it("validates its input and needs a login", async () => {
    expect((await ctx.api.post("/api/admin/orders/bulk").set(auth).send({ numbers: [], status: "completed" })).status).toBe(400);
    expect((await ctx.api.post("/api/admin/orders/bulk").set(auth).send({ numbers: [1], status: "pending" })).status).toBe(400);
    expect((await ctx.api.post("/api/admin/orders/bulk").send({ numbers: [1], status: "completed" })).status).toBe(401);
  });
});
