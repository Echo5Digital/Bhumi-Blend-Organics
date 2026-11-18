import http from "node:http";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { loadEnv } from "../src/config/env.js";
import { Coupon } from "../src/models/Coupon.js";
import { Order } from "../src/models/Order.js";
import { Product } from "../src/models/Product.js";
import { Setting } from "../src/models/Setting.js";
import { createStorefrontNotifier } from "../src/services/storefront.js";
import { adminHeader, fakeGateway, fakeNotifier, paymentSignature, startTestApp, validAddress, webhookSignature } from "./helpers.js";

// ---- the notifier itself: a real HTTP call to a tiny fake storefront -------------

type Hit = { method?: string; url?: string; authorization?: string; body: unknown };

async function fakeStorefront(status = 200) {
  const hits: Hit[] = [];
  const server = http.createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      hits.push({ method: request.method, url: request.url, authorization: request.headers.authorization, body: JSON.parse(Buffer.concat(chunks).toString("utf8")) });
      response.statusCode = status;
      response.end("{}");
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  return { url: `http://127.0.0.1:${port}`, hits, close: () => new Promise<void>((resolve) => server.close(() => resolve())) };
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 150));

describe("telling the storefront to refresh", () => {
  const closers: (() => Promise<void>)[] = [];
  afterEach(async () => {
    vi.restoreAllMocks();
    while (closers.length) await closers.pop()!();
  });

  it("posts the changed parts, with the shared secret", async () => {
    const storefront = await fakeStorefront();
    closers.push(storefront.close);
    const notifier = createStorefrontNotifier({ STOREFRONT_URL: `${storefront.url}/`, REVALIDATE_SECRET: "a-long-shared-secret-123" });
    notifier.revalidate(["catalog", "settings"]);
    await settle();
    expect(storefront.hits).toEqual([{ method: "POST", url: "/api/revalidate", authorization: "Bearer a-long-shared-secret-123", body: { tags: ["catalog", "settings"] } }]);
  });

  it("does nothing at all when the storefront address or the secret isn't set", async () => {
    const storefront = await fakeStorefront();
    closers.push(storefront.close);
    createStorefrontNotifier({ STOREFRONT_URL: storefront.url, REVALIDATE_SECRET: undefined }).revalidate(["catalog"]);
    createStorefrontNotifier({ STOREFRONT_URL: undefined, REVALIDATE_SECRET: "a-long-shared-secret-123" }).revalidate(["catalog"]);
    await settle();
    expect(storefront.hits).toHaveLength(0);
  });

  it("never throws, and says what went wrong, when the storefront is down", async () => {
    const storefront = await fakeStorefront();
    const deadUrl = storefront.url;
    await storefront.close();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    createStorefrontNotifier({ STOREFRONT_URL: deadUrl, REVALIDATE_SECRET: "a-long-shared-secret-123" }).revalidate(["catalog"]);
    await settle();
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0]?.[0])).toContain("pages will update on their own");
  });

  it("warns, without throwing, when the storefront refuses (wrong secret)", async () => {
    const storefront = await fakeStorefront(401);
    closers.push(storefront.close);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    createStorefrontNotifier({ STOREFRONT_URL: storefront.url, REVALIDATE_SECRET: "a-long-shared-secret-123" }).revalidate(["catalog"]);
    await settle();
    expect(String(warn.mock.calls[0]?.[0])).toContain("REVALIDATE_SECRET");
  });

  it("is configured through two environment settings, checked at start-up", () => {
    const base = { MONGODB_URI: "mongodb://localhost/x", JWT_SECRET: "x".repeat(32) };
    expect(loadEnv(base).STOREFRONT_URL).toBeUndefined();
    expect(loadEnv({ ...base, STOREFRONT_URL: "http://localhost:3000", REVALIDATE_SECRET: "a-long-shared-secret-123" })).toMatchObject({ STOREFRONT_URL: "http://localhost:3000", REVALIDATE_SECRET: "a-long-shared-secret-123" });
    expect(loadEnv({ ...base, STOREFRONT_URL: "", REVALIDATE_SECRET: "" }).REVALIDATE_SECRET).toBeUndefined();
    expect(() => loadEnv({ ...base, STOREFRONT_URL: "not a url" })).toThrow(/STOREFRONT_URL/);
    expect(() => loadEnv({ ...base, REVALIDATE_SECRET: "short" })).toThrow(/REVALIDATE_SECRET/);
  });
});

// ---- which changes trigger it ---------------------------------------------------

const gateway = fakeGateway();
const recorder = fakeNotifier();
let ctx: Awaited<ReturnType<typeof startTestApp>>;
let auth: { Authorization: string };

beforeAll(async () => {
  ctx = await startTestApp({ payments: gateway.gateway, notifier: recorder.notifier });
  auth = await adminHeader(ctx.api);
});
afterAll(() => ctx.stop());
beforeEach(async () => {
  await Order.deleteMany({});
  await Coupon.deleteMany({});
  await Setting.deleteMany({});
  await Product.updateMany({}, { $unset: { stockQuantity: "" }, $set: { inStock: true, isActive: true } });
  recorder.calls.length = 0;
});

const newProduct = (slug: string) => ({ slug, name: "Notify Test", price: 100, image: { url: "/x.jpg" } });

describe("admin edits that change what the shop shows", () => {
  it("products: creating, editing and deleting each ask for a refresh; a refused edit doesn't", async () => {
    const created = await ctx.api.post("/api/admin/products").set(auth).send(newProduct("notify-test")).expect(201);
    expect(recorder.calls).toEqual([["catalog"]]);
    await ctx.api.patch(`/api/admin/products/${created.body.product.id}`).set(auth).send({ price: 120 }).expect(200);
    expect(recorder.calls).toEqual([["catalog"], ["catalog"]]);
    await ctx.api.delete(`/api/admin/products/${created.body.product.id}`).set(auth).expect(204);
    expect(recorder.calls).toHaveLength(3);

    recorder.calls.length = 0;
    await ctx.api.post("/api/admin/products").set(auth).send({ ...newProduct("bad slug!") }).expect(400);
    await ctx.api.patch("/api/admin/products/aloe-pure-shampoo").set(auth).send({}).expect(400);
    await ctx.api.delete("/api/admin/products/does-not-exist").set(auth).expect(404);
    expect(recorder.calls).toEqual([]);
  });

  it("categories: add, edit, delete", async () => {
    const created = await ctx.api.post("/api/admin/categories").set(auth).send({ slug: "notify-cat", name: "Notify" }).expect(201);
    await ctx.api.patch(`/api/admin/categories/${created.body.category.id}`).set(auth).send({ name: "Renamed" }).expect(200);
    await ctx.api.delete("/api/admin/categories/notify-cat").set(auth).expect(204);
    expect(recorder.calls).toEqual([["catalog"], ["catalog"], ["catalog"]]);
  });

  it("settings: saving asks for the 'settings' part only", async () => {
    const { settings } = (await ctx.api.get("/api/admin/settings").set(auth)).body;
    await ctx.api.put("/api/admin/settings").set(auth).send({ ...settings, contactPhone: "+91 99999 99999" }).expect(200);
    expect(recorder.calls).toEqual([["settings"]]);
    await ctx.api.put("/api/admin/settings").set(auth).send({ ...settings, contactEmail: "nope" }).expect(400);
    expect(recorder.calls).toHaveLength(1);
  });

  it("coupons: the shop doesn't cache them, so nothing is asked", async () => {
    await ctx.api.post("/api/admin/coupons").set(auth).send({ code: "SAVE5", type: "fixed", value: 5 }).expect(201);
    await ctx.api.patch("/api/admin/coupons/SAVE5").set(auth).send({ value: 6 }).expect(200);
    await ctx.api.delete("/api/admin/coupons/SAVE5").set(auth).expect(204);
    expect(recorder.calls).toEqual([]);
  });
});

describe("order activity that moves stock", () => {
  async function place() {
    const response = await ctx.api.post("/api/orders").send({ items: [{ slug: "aloe-pure-shampoo", qty: 1 }], email: "a@b.co", shipping: validAddress }).expect(201);
    return { number: response.body.order.number as number, token: response.body.accessToken as string, rzp: response.body.payment.razorpayOrderId as string };
  }
  const verify = (order: { number: number; token: string; rzp: string }) =>
    ctx.api
      .post(`/api/orders/${order.number}/verify-payment`)
      .set("X-Order-Token", order.token)
      .send({ razorpay_order_id: order.rzp, razorpay_payment_id: `pay_${order.number}`, razorpay_signature: paymentSignature(order.rzp, `pay_${order.number}`) })
      .expect(200);

  it("a payment asks once, even if the same payment is confirmed twice", async () => {
    const order = await place();
    expect(recorder.calls).toEqual([]); // placing an order alone takes no stock
    await verify(order);
    expect(recorder.calls).toEqual([["catalog"]]);
    await verify(order); // already paid: nothing changed
    expect(recorder.calls).toEqual([["catalog"]]);
  });

  it("Razorpay's webhook asks too", async () => {
    const order = await place();
    const raw = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_hook", order_id: order.rzp, amount: 59_900 } } } });
    await ctx.api.post("/api/webhooks/razorpay").set("Content-Type", "application/json").set("X-Razorpay-Signature", webhookSignature(raw)).send(raw).expect(200);
    expect(recorder.calls).toEqual([["catalog"]]);
  });

  it("the admin cancelling or refunding asks (stock goes back), plain progress doesn't", async () => {
    const a = await place();
    await verify(a);
    const b = await place();
    await verify(b);
    recorder.calls.length = 0;

    await ctx.api.patch(`/api/admin/orders/${a.number}`).set(auth).send({ status: "shipped" }).expect(200);
    expect(recorder.calls).toEqual([]);
    await ctx.api.patch(`/api/admin/orders/${a.number}`).set(auth).send({ status: "refunded" }).expect(200);
    expect(recorder.calls).toEqual([["catalog"]]);
    await ctx.api.post("/api/admin/orders/bulk").set(auth).send({ numbers: [b.number], status: "cancelled" }).expect(200);
    expect(recorder.calls).toEqual([["catalog"], ["catalog"]]);
  });
});

describe("the store's public details", () => {
  it("are public, and start out empty so the storefront keeps its own text", async () => {
    const { body } = await ctx.api.get("/api/settings").expect(200);
    expect(body).toEqual({ storeName: "Bhumi Blend Organics", contactEmail: "", contactPhone: "", address: { line1: "", line2: "", city: "", state: "", pin: "", country: "India" } });
  });

  it("follow what the admin saves — and nothing private comes with them", async () => {
    const { settings } = (await ctx.api.get("/api/admin/settings").set(auth)).body;
    await ctx.api
      .put("/api/admin/settings")
      .set(auth)
      .send({ ...settings, storeName: "Bhumi Blend", contactEmail: "hello@bhumiblend.com", contactPhone: "+91 89214 10904", couponsEnabled: false, lowStockThreshold: 9, address: { ...settings.address, line1: "64/5434-B", city: "Kochi", state: "Kerala", pin: "682017" } })
      .expect(200);
    const { body } = await ctx.api.get("/api/settings").expect(200);
    expect(body).toMatchObject({ storeName: "Bhumi Blend", contactEmail: "hello@bhumiblend.com", contactPhone: "+91 89214 10904", address: { line1: "64/5434-B", city: "Kochi", pin: "682017" } });
    expect(Object.keys(body).sort()).toEqual(["address", "contactEmail", "contactPhone", "storeName"]); // not the coupon switch or stock level
  });
});

describe("product cards", () => {
  it("carry the pack size", async () => {
    const { body } = await ctx.api.get("/api/products?limit=100").expect(200);
    const oil = body.items.find((card: { slug: string }) => card.slug === "best-ayurvedic-hair-oil");
    expect(oil.weight).toBe("200ml");
  });
});
