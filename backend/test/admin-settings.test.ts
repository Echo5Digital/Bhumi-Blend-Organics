import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Coupon } from "../src/models/Coupon.js";
import { Product } from "../src/models/Product.js";
import { Setting } from "../src/models/Setting.js";
import { adminHeader, fakeGateway, fakeImages, fakeMailer, startTestApp, validAddress } from "./helpers.js";

const gateway = fakeGateway();
const store = fakeImages();
const mail = fakeMailer();
let ctx: Awaited<ReturnType<typeof startTestApp>>;
let auth: { Authorization: string };

beforeAll(async () => {
  ctx = await startTestApp({ payments: gateway.gateway, images: store.images, mailer: mail.mailer });
  auth = await adminHeader(ctx.api);
});
afterAll(() => ctx.stop());
beforeEach(async () => {
  await Setting.deleteMany({});
  await Coupon.deleteMany({});
  await Product.updateMany({}, { $unset: { stockQuantity: "" }, $set: { inStock: true, isActive: true } });
});

const get = async () => (await ctx.api.get("/api/admin/settings").set(auth).expect(200)).body.settings;
const put = (body: object) => ctx.api.put("/api/admin/settings").set(auth).send(body);

describe("settings", () => {
  it("start with sensible defaults before anything is saved", async () => {
    expect(await get()).toEqual({
      storeName: "Bhumi Blend Organics",
      address: { line1: "", line2: "", city: "", state: "", pin: "", country: "India" },
      contactEmail: "",
      contactPhone: "",
      couponsEnabled: true,
      lowStockThreshold: 2,
    });
  });

  it("save the whole form and read it back", async () => {
    const settings = {
      storeName: "Bhumi Blend",
      address: { line1: "64/5434-B Kathrikkadavu Road", line2: "Kaloor", city: "Kochi", state: "Kerala", pin: "682017", country: "India" },
      contactEmail: "support@bhumiblend.com",
      contactPhone: "+91 89214 10904",
      couponsEnabled: false,
      lowStockThreshold: 5,
    };
    const saved = await put(settings).expect(200);
    expect(saved.body.settings).toEqual(settings);
    expect(await get()).toEqual(settings);
    await put({ ...settings, couponsEnabled: true }).expect(200); // saving again updates the same record
    expect(await Setting.countDocuments()).toBe(1);
  });

  it("refuse mistakes, listing each one", async () => {
    const base = await get();
    const response = await put({ ...base, storeName: "", address: { ...base.address, pin: "12", state: "Atlantis" }, contactEmail: "nope", lowStockThreshold: -1 });
    expect(response.status).toBe(400);
    const paths = response.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(["storeName", "address.pin", "address.state", "contactEmail", "lowStockThreshold"]));
    expect((await ctx.api.get("/api/admin/settings")).status).toBe(401);
  });

  it("turn coupons off at checkout", async () => {
    await Coupon.create({ code: "SAVE10", type: "percent", value: 10 });
    const items = [{ slug: "aloe-pure-shampoo", qty: 1 }];
    await ctx.api.post("/api/coupons/validate").send({ code: "SAVE10", items }).expect(200);

    await put({ ...(await get()), couponsEnabled: false }).expect(200);
    const refused = await ctx.api.post("/api/coupons/validate").send({ code: "SAVE10", items });
    expect(refused.status).toBe(400);
    expect(refused.body.error.code).toBe("COUPONS_DISABLED");
    const order = await ctx.api.post("/api/orders").send({ items, email: "a@b.co", shipping: validAddress, couponCode: "SAVE10" });
    expect(order.body.error.code).toBe("COUPONS_DISABLED");
    await ctx.api.post("/api/orders").send({ items, email: "a@b.co", shipping: validAddress }).expect(201); // no coupon: fine
  });
});

describe("system status", () => {
  it("says what is connected, without exposing any secret", async () => {
    const { body } = await ctx.api.get("/api/admin/system").set(auth).expect(200);
    expect(body.database).toMatchObject({ connected: true, counts: { products: 25, categories: 4 } });
    expect(body.services.payments).toMatchObject({ configured: true, label: "Razorpay payments" });
    expect(body.services.images.configured).toBe(true);
    expect(body.services.email.configured).toBe(true);
    expect(body.server).toMatchObject({ environment: "test", nodeVersion: process.version, allowedOrigins: ["http://localhost:3000"] });
    expect(body.server.uptimeSeconds).toBeGreaterThanOrEqual(0);

    const text = JSON.stringify(body);
    expect(text).not.toContain(ctx.env.JWT_SECRET);
    expect(text).not.toContain(ctx.env.MONGODB_URI);
    expect(text).not.toMatch(/mongodb:\/\//);
    expect((await ctx.api.get("/api/admin/system")).status).toBe(401);
  });
});

describe("product stock in the admin", () => {
  const create = (extra: object = {}) =>
    ctx.api.post("/api/admin/products").set(auth).send({ slug: `stock-${Math.random().toString(36).slice(2, 8)}`, name: "Stock Test", price: 100, image: { url: "/x.jpg" }, ...extra });

  it("makes 'in stock' follow the count, unless you say otherwise", async () => {
    const counted = await create({ stockQuantity: 5 }).then((r) => r.body.product);
    expect(counted).toMatchObject({ stockQuantity: 5, inStock: true });
    const empty = await create({ stockQuantity: 0 }).then((r) => r.body.product);
    expect(empty).toMatchObject({ stockQuantity: 0, inStock: false });
    const untracked = await create().then((r) => r.body.product);
    expect(untracked.stockQuantity).toBeUndefined();
    expect(untracked.inStock).toBe(true);

    const sold = await ctx.api.patch(`/api/admin/products/${counted.id}`).set(auth).send({ stockQuantity: 0 }).expect(200);
    expect(sold.body.product).toMatchObject({ stockQuantity: 0, inStock: false });
    const restocked = await ctx.api.patch(`/api/admin/products/${counted.id}`).set(auth).send({ stockQuantity: 12 }).expect(200);
    expect(restocked.body.product).toMatchObject({ stockQuantity: 12, inStock: true });
    const cleared = await ctx.api.patch(`/api/admin/products/${counted.id}`).set(auth).send({ stockQuantity: null }).expect(200);
    expect(cleared.body.product.stockQuantity).toBeUndefined();
    expect((await ctx.api.patch(`/api/admin/products/${counted.id}`).set(auth).send({ stockQuantity: -3 })).status).toBe(400);
    expect((await ctx.api.patch(`/api/admin/products/${counted.id}`).set(auth).send({ stockQuantity: 1.5 })).status).toBe(400);
  });

  it("filters the product list by stock and sorts it", async () => {
    await Product.updateOne({ slug: "aloe-pure-shampoo" }, { stockQuantity: 1 });
    await Product.updateOne({ slug: "buy-pure-aloe-vera-gel" }, { stockQuantity: 0, inStock: false });
    const slugs = async (query: string) =>
      (await ctx.api.get(`/api/admin/products?limit=100&${query}`).set(auth).expect(200)).body.items.map((p: { slug: string }) => p.slug);

    expect(await slugs("stock=low")).toEqual(["aloe-pure-shampoo"]);
    expect(await slugs("stock=outofstock")).toEqual(["buy-pure-aloe-vera-gel"]);
    // everything except the one sold-out product (other tests in this file add products, so count the real total)
    expect(await slugs("stock=instock")).toHaveLength((await Product.countDocuments()) - 1);

    const cheapest = await ctx.api.get("/api/admin/products?sort=price&dir=asc&limit=2").set(auth).expect(200);
    expect(cheapest.body.items[0].price).toBeLessThanOrEqual(cheapest.body.items[1].price);
    const byName = (await slugs("sort=name&dir=desc")).slice(0, 1);
    expect(byName).toHaveLength(1);
    expect((await ctx.api.get("/api/admin/products?stock=sideways").set(auth)).status).toBe(400);
  });

  it("gives the Published / Hidden counts for the list's tabs", async () => {
    await Product.updateOne({ slug: "aloe-pure-shampoo" }, { isActive: false });
    const { counts, total } = (await ctx.api.get("/api/admin/products?status=hidden").set(auth).expect(200)).body;
    const all = await Product.countDocuments();
    expect(counts).toEqual({ all, active: all - 1, hidden: 1 });
    expect(total).toBe(1);
  });
});
