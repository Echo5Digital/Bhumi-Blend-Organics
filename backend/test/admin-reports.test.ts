import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { signCustomerToken } from "../src/middleware/auth.js";
import { Category } from "../src/models/Category.js";
import { Coupon } from "../src/models/Coupon.js";
import { Customer } from "../src/models/Customer.js";
import { Order } from "../src/models/Order.js";
import { Product } from "../src/models/Product.js";
import { Setting } from "../src/models/Setting.js";
import { adminHeader, fakeGateway, paymentSignature, startTestApp, validAddress } from "./helpers.js";

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
  await Customer.deleteMany({});
  await Setting.deleteMany({});
  await Product.updateMany({}, { $unset: { stockQuantity: "" }, $set: { inStock: true, isActive: true } });
});

type Opts = { slug?: string; qty?: number; at: string; paid?: boolean; couponCode?: string; token?: string };

/** Place an order, give it a date, and optionally pay for it. */
async function order({ slug = "aloe-pure-shampoo", qty = 1, at, paid = true, couponCode, token }: Opts) {
  const request = ctx.api.post("/api/orders");
  if (token) request.set("Authorization", `Bearer ${token}`);
  const response = await request.send({ items: [{ slug, qty }], email: "buyer@example.com", shipping: validAddress, couponCode });
  expect(response.status, JSON.stringify(response.body)).toBe(201);
  const number = response.body.order.number as number;
  if (paid) {
    const rzp = response.body.payment.razorpayOrderId as string;
    await ctx.api
      .post(`/api/orders/${number}/verify-payment`)
      .set("X-Order-Token", response.body.accessToken)
      .send({ razorpay_order_id: rzp, razorpay_payment_id: `pay_${number}`, razorpay_signature: paymentSignature(rzp, `pay_${number}`) })
      .expect(200);
  }
  await Order.collection.updateOne({ number }, { $set: { createdAt: new Date(at) } });
  return number;
}
const adminPatch = (number: number, status: string) => ctx.api.patch(`/api/admin/orders/${number}`).set(auth).send({ status }).expect(200);
const report = async (name: string, query = "") => (await ctx.api.get(`/api/admin/reports/${name}${query}`).set(auth)).body;

const RANGE = "?from=2026-02-09&to=2026-02-13";

/**
 * A small, hand-checkable shop (shampoo ₹599, aloe gel ₹250, Feb 2026, Indian time):
 *   A  shampoo ×1            Feb 10 11:00 IST  paid
 *   B  gel ×2 (₹500)         Feb 11 03:30 IST  paid   (22:00Z on the 10th: a UTC day earlier than its Indian day)
 *   C  shampoo ×1            Feb 12            paid, then refunded
 *   D  shampoo ×1            Feb 12            paid, then cancelled by the admin  (never counts)
 *   E  shampoo ×1            Feb 12            not paid                            (never counts)
 *   F  gel ×1 with ₹100 off  Feb 12            paid
 */
async function seedShop() {
  await Coupon.create({ code: "SAVE100", type: "fixed", value: 100 });
  await order({ at: "2026-02-10T05:30:00Z" }); // A
  await order({ slug: "buy-pure-aloe-vera-gel", qty: 2, at: "2026-02-10T22:00:00Z" }); // B
  const c = await order({ at: "2026-02-12T06:00:00Z" }); // C
  await adminPatch(c, "refunded");
  const d = await order({ at: "2026-02-12T06:00:00Z" }); // D
  await adminPatch(d, "cancelled");
  await order({ at: "2026-02-12T06:00:00Z", paid: false }); // E
  await order({ slug: "buy-pure-aloe-vera-gel", at: "2026-02-12T07:00:00Z", couponCode: "SAVE100" }); // F
}

describe("sales by date", () => {
  it("adds up paid, uncancelled orders and takes refunds off the net", async () => {
    await seedShop();
    const { summary, groupBy, from, to } = await report("sales", RANGE);
    expect({ from, to, groupBy }).toEqual({ from: "2026-02-09", to: "2026-02-13", groupBy: "day" });
    expect(summary).toEqual({
      grossSales: 1349, // A 599 + B 500 + F 250
      netSales: 650, // 1349 − 100 coupon − 599 refunded
      orders: 3,
      items: 4,
      refunds: { count: 1, amount: 599 },
      shipping: 0,
      couponDiscounts: 100,
      averageGrossPerDay: 269.8,
      averageOrdersPerDay: 0.6,
    });
  });

  it("gives one point per day, empty days included, on Indian days", async () => {
    await seedShop();
    const { series } = await report("sales", RANGE);
    expect(series.map((point: { date: string }) => point.date)).toEqual(["2026-02-09", "2026-02-10", "2026-02-11", "2026-02-12", "2026-02-13"]);
    const gross = series.map((point: { grossSales: number }) => point.grossSales);
    // B was placed at 22:00 UTC on the 10th, which is already the 11th in India
    expect(gross).toEqual([0, 599, 500, 250, 0]);
    expect(series.map((point: { orders: number }) => point.orders)).toEqual([0, 1, 1, 1, 0]);
    // the refund is taken off the day the refunded order was placed, and the points add up to the summary
    expect(series[3].netSales).toBe(250 - 100 - 599);
    expect(series.reduce((total: number, point: { netSales: number }) => total + point.netSales, 0)).toBeCloseTo(650, 2);
  });

  it("switches to months for long ranges", async () => {
    await seedShop();
    const long = await report("sales", "?from=2026-01-01&to=2026-06-30");
    expect(long.groupBy).toBe("month");
    expect(long.series.map((point: { date: string }) => point.date)).toEqual(["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"]);
    expect(long.series[1].grossSales).toBe(1349);
    expect(long.series[0].grossSales).toBe(0);
  });

  it("covers just the days asked for", async () => {
    await seedShop();
    const day = await report("sales", "?from=2026-02-12&to=2026-02-12");
    expect(day.summary).toMatchObject({ grossSales: 250, orders: 1, couponDiscounts: 100 });
    const empty = await report("sales", "?from=2026-03-01&to=2026-03-07");
    expect(empty.summary).toMatchObject({ grossSales: 0, netSales: 0, orders: 0 });
    expect(empty.series).toHaveLength(7);
  });

  it("defaults to this month so far, and rejects bad ranges", async () => {
    const response = await ctx.api.get("/api/admin/reports/sales").set(auth).expect(200);
    expect(response.body.from).toMatch(/^\d{4}-\d{2}-01$/);
    expect(response.body.to >= response.body.from).toBe(true);

    const backwards = await ctx.api.get("/api/admin/reports/sales?from=2026-03-02&to=2026-03-01").set(auth);
    expect(backwards.status).toBe(400);
    expect(backwards.body.error.code).toBe("INVALID_RANGE");
    const tooLong = await ctx.api.get("/api/admin/reports/sales?from=2024-01-01&to=2026-01-01").set(auth);
    expect(tooLong.body.error.code).toBe("RANGE_TOO_LONG");
    expect((await ctx.api.get("/api/admin/reports/sales?from=yesterday").set(auth)).status).toBe(400);
    expect((await ctx.api.get("/api/admin/reports/sales")).status).toBe(401);
  });
});

describe("sales by product and category", () => {
  it("ranks products by revenue", async () => {
    await seedShop();
    const { items } = await report("products", RANGE);
    expect(items).toEqual([
      { slug: "buy-pure-aloe-vera-gel", name: "Original Aloe Vera Gel", quantity: 3, revenue: 750 },
      { slug: "aloe-pure-shampoo", name: "Aloe Pure Shampoo", quantity: 1, revenue: 599 },
    ]);
  });

  it("splits revenue by category, counting a product in each of its categories", async () => {
    await Category.updateOne({ slug: "hair" }, { name: "Hair Care" });
    await Product.updateOne({ slug: "aloe-pure-shampoo" }, { categories: [{ category: "hair", position: 0 }] });
    await Product.updateOne({ slug: "buy-pure-aloe-vera-gel" }, { categories: [{ category: "face", position: 0 }, { category: "body", position: 0 }] });
    await seedShop();
    const { items } = await report("categories", RANGE);
    const by = Object.fromEntries(items.map((row: { slug: string }) => [row.slug, row]));
    expect(by.hair).toMatchObject({ name: "Hair Care", quantity: 1, revenue: 599 });
    expect(by.face).toMatchObject({ quantity: 3, revenue: 750 });
    expect(by.body).toMatchObject({ quantity: 3, revenue: 750 });
  });

  it("puts products with no category under 'Uncategorised'", async () => {
    await Product.updateOne({ slug: "aloe-pure-shampoo" }, { categories: [] });
    await order({ at: "2026-02-10T05:30:00Z" });
    const { items } = await report("categories", RANGE);
    expect(items).toEqual([{ slug: "uncategorised", name: "Uncategorised", quantity: 1, revenue: 599 }]);
  });
});

describe("coupons report", () => {
  it("shows each code's uses and what it took off", async () => {
    await seedShop();
    const result = await report("coupons", RANGE);
    expect(result.items).toEqual([{ code: "SAVE100", orders: 1, discount: 100 }]);
    expect(result.summary).toEqual({ ordersWithCoupon: 1, totalDiscount: 100 });
    expect(result.series.find((point: { date: string }) => point.date === "2026-02-12").discount).toBe(100);
    expect(result.series).toHaveLength(5);
  });
});

describe("customers report", () => {
  it("compares accounts and guests, and counts sign-ups", async () => {
    const asha = await Customer.create({ email: "asha@example.com", firstName: "Asha", lastName: "Nair", passwordHash: "x" });
    await Customer.collection.updateOne({ _id: asha._id }, { $set: { createdAt: new Date("2026-02-11T06:00:00Z") } });
    await order({ at: "2026-02-10T05:30:00Z", token: signCustomerToken(ctx.env, String(asha._id)) }); // 599, account
    await order({ at: "2026-02-10T05:30:00Z" }); // 599, guest
    await order({ slug: "buy-pure-aloe-vera-gel", at: "2026-02-12T05:30:00Z" }); // 250, guest

    const { summary, series } = await report("customers", RANGE);
    expect(summary).toEqual({
      registeredCustomers: 1,
      newCustomers: 1,
      ordersFromAccounts: 1,
      ordersFromGuests: 2,
      revenueFromAccounts: 599,
      revenueFromGuests: 849,
    });
    expect(series.find((point: { date: string }) => point.date === "2026-02-11").newCustomers).toBe(1);
    expect(series.filter((point: { newCustomers: number }) => point.newCustomers > 0)).toHaveLength(1);
  });
});

describe("stock report", () => {
  async function setStock() {
    await Product.updateOne({ slug: "aloe-pure-shampoo" }, { stockQuantity: 1 });
    await Product.updateOne({ slug: "buy-pure-aloe-vera-gel" }, { stockQuantity: 2 });
    await Product.updateOne({ slug: "best-ayurvedic-hair-oil" }, { stockQuantity: 50 });
    await Product.updateOne({ slug: "gua-sha-face-tool" }, { stockQuantity: 0, inStock: false });
    await Product.updateOne({ slug: "ayurvedic-anti-aging-cream" }, { inStock: false }); // switched off by hand, no count
    await Product.updateOne({ slug: "best-organic-body-lotion-for-dry-skin" }, { stockQuantity: 3, isActive: false }); // hidden: ignored
  }
  const slugs = (rows: { slug: string }[]) => rows.map((row) => row.slug);

  it("lists low, out and most-stocked products using the low-stock level", async () => {
    await setStock();
    const result = await report("stock");
    expect(result.lowStockThreshold).toBe(2);
    expect(slugs(result.low)).toEqual(["aloe-pure-shampoo", "buy-pure-aloe-vera-gel"]);
    expect(slugs(result.out).sort()).toEqual(["ayurvedic-anti-aging-cream", "gua-sha-face-tool"]);
    expect(result.most[0]).toMatchObject({ slug: "best-ayurvedic-hair-oil", stockQuantity: 50 });
    expect(slugs(result.most)).not.toContain("best-organic-body-lotion-for-dry-skin");
    expect(result.productsWithStockCount).toBe(4);
  });

  it("follows the low-stock level from Settings", async () => {
    await setStock();
    await ctx.api.put("/api/admin/settings").set(auth).send(await currentSettings({ lowStockThreshold: 1 })).expect(200);
    expect(slugs((await report("stock")).low)).toEqual(["aloe-pure-shampoo"]);
    await ctx.api.put("/api/admin/settings").set(auth).send(await currentSettings({ lowStockThreshold: 5 })).expect(200);
    expect(slugs((await report("stock")).low)).toEqual(["aloe-pure-shampoo", "buy-pure-aloe-vera-gel"]);
  });
});

async function currentSettings(change: object) {
  const { settings } = (await ctx.api.get("/api/admin/settings").set(auth).expect(200)).body;
  return { ...settings, ...change };
}
