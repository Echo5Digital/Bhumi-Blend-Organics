import jwt from "jsonwebtoken";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AdminUser } from "../src/models/AdminUser.js";
import { Category } from "../src/models/Category.js";
import { Coupon } from "../src/models/Coupon.js";
import { Order } from "../src/models/Order.js";
import { Product } from "../src/models/Product.js";
import { adminHeader, fakeGateway, fakeImages, paymentSignature, startTestApp, validAddress } from "./helpers.js";

const gateway = fakeGateway();
const store = fakeImages();
let ctx: Awaited<ReturnType<typeof startTestApp>>;
let auth: { Authorization: string };

beforeAll(async () => {
  ctx = await startTestApp({ payments: gateway.gateway, images: store.images });
  auth = await adminHeader(ctx.api);
});
afterAll(() => ctx.stop());

describe("admin login", () => {
  it("rejects requests without a valid token", async () => {
    expect((await ctx.api.get("/api/admin/products")).status).toBe(401);
    expect((await ctx.api.get("/api/admin/products").set("Authorization", "Bearer nonsense")).body.error.code).toBe("TOKEN_INVALID");
    expect((await ctx.api.get("/api/admin/products").set("Authorization", "Basic abc")).status).toBe(401);
  });

  it("rejects a token signed with some other secret", async () => {
    const admin = await AdminUser.findOne();
    const forged = jwt.sign({ role: "admin" }, "another-secret-another-secret-another-secret", { subject: String(admin!._id) });
    expect((await ctx.api.get("/api/admin/stats").set("Authorization", `Bearer ${forged}`)).status).toBe(401);
  });

  it("logs in with the right password only, without revealing which part was wrong", async () => {
    const wrongPassword = await ctx.api.post("/api/admin/auth/login").send({ email: "boss@example.com", password: "nope" });
    const wrongEmail = await ctx.api.post("/api/admin/auth/login").send({ email: "who@example.com", password: "a-long-test-password" });
    expect(wrongPassword.status).toBe(401);
    expect(wrongEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(wrongEmail.body);

    const ok = await ctx.api.post("/api/admin/auth/login").send({ email: "BOSS@example.com", password: "a-long-test-password" }).expect(200);
    expect(ok.body.admin).toMatchObject({ email: "boss@example.com", name: "Boss" });
    expect(JSON.stringify(ok.body)).not.toContain("passwordHash");
    const me = await ctx.api.get("/api/admin/auth/me").set("Authorization", `Bearer ${ok.body.token}`).expect(200);
    expect(me.body.admin.email).toBe("boss@example.com");
  });

  it("stops a switched-off admin immediately", async () => {
    await AdminUser.updateOne({ email: "boss@example.com" }, { isActive: false });
    expect((await ctx.api.get("/api/admin/stats").set(auth)).status).toBe(401);
    expect((await ctx.api.post("/api/admin/auth/login").send({ email: "boss@example.com", password: "a-long-test-password" })).status).toBe(401);
    await AdminUser.updateOne({ email: "boss@example.com" }, { isActive: true });
  });
});

describe("admin products", () => {
  const newProduct = { slug: "test-soap", name: "Test Soap", price: 120, image: { url: "https://res.cloudinary.com/x/soap.jpg", publicId: "bhumiblend/soap" } };

  it("lists everything, including hidden products, and filters", async () => {
    const all = await ctx.api.get("/api/admin/products?limit=100").set(auth).expect(200);
    expect(all.body.total).toBe(25);
    expect(all.body.items[0]).toHaveProperty("id");
    await Product.updateOne({ slug: "aloe-pure-shampoo" }, { isActive: false });
    const hidden = await ctx.api.get("/api/admin/products?status=hidden").set(auth).expect(200);
    expect(hidden.body.items.map((p: { slug: string }) => p.slug)).toEqual(["aloe-pure-shampoo"]);
    const found = await ctx.api.get("/api/admin/products?search=shampoo&status=all").set(auth).expect(200);
    expect(found.body.items.some((p: { slug: string }) => p.slug === "aloe-pure-shampoo")).toBe(true);
    await Product.updateOne({ slug: "aloe-pure-shampoo" }, { isActive: true });
  });

  it("creates, reads (by id or slug), updates and deletes a product", async () => {
    const created = await ctx.api.post("/api/admin/products").set(auth).send(newProduct).expect(201);
    const id = created.body.product.id as string;
    expect(created.body.product).toMatchObject({ slug: "test-soap", price: 120, inStock: true, isActive: true });

    // shows up on the public shop straight away
    const publicCard = await ctx.api.get("/api/products?search=test%20soap").expect(200);
    expect(publicCard.body.items[0]).toMatchObject({ slug: "test-soap", image: "https://res.cloudinary.com/x/soap.jpg", hoverImage: "https://res.cloudinary.com/x/soap.jpg" });

    expect((await ctx.api.get(`/api/admin/products/${id}`).set(auth)).body.product.slug).toBe("test-soap");
    expect((await ctx.api.get("/api/admin/products/test-soap").set(auth)).body.product.id).toBe(id);

    const patched = await ctx.api.patch(`/api/admin/products/${id}`).set(auth).send({ price: 99, regularPrice: 150, categories: [{ category: "body", position: 3 }] }).expect(200);
    expect(patched.body.product).toMatchObject({ price: 99, regularPrice: 150, categories: [{ category: "body", position: 3 }] });

    // null clears an optional field; leaving a field out keeps it
    const cleared = await ctx.api.patch("/api/admin/products/test-soap").set(auth).send({ regularPrice: null }).expect(200);
    expect(cleared.body.product.regularPrice).toBeUndefined();
    expect(cleared.body.product.price).toBe(99);

    await ctx.api.patch("/api/admin/products/test-soap").set(auth).send({ isActive: false }).expect(200);
    await ctx.api.get("/api/products/test-soap").expect(404);

    await ctx.api.delete(`/api/admin/products/${id}`).set(auth).expect(204);
    await ctx.api.get(`/api/admin/products/${id}`).set(auth).expect(404);
  });

  it("refuses bad input", async () => {
    const duplicate = await ctx.api.post("/api/admin/products").set(auth).send({ ...newProduct, slug: "aloe-pure-shampoo" });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("DUPLICATE");

    const badSlug = await ctx.api.post("/api/admin/products").set(auth).send({ ...newProduct, slug: "Not A Slug" });
    expect(badSlug.status).toBe(400);
    const noPrice = await ctx.api.post("/api/admin/products").set(auth).send({ slug: "x", name: "X", image: { url: "/x.jpg" } });
    expect(noPrice.status).toBe(400);
    const negative = await ctx.api.post("/api/admin/products").set(auth).send({ ...newProduct, slug: "neg", price: -5 });
    expect(negative.status).toBe(400);
    const backwards = await ctx.api.post("/api/admin/products").set(auth).send({ ...newProduct, slug: "back", price: 500, regularPrice: 100 });
    expect(backwards.body.error.details[0].path).toBe("regularPrice");

    expect((await ctx.api.patch("/api/admin/products/aloe-pure-shampoo").set(auth).send({})).status).toBe(400);
    const priceAboveOffer = await ctx.api.patch("/api/admin/products/best-ayurvedic-hair-oil").set(auth).send({ price: 900 });
    expect(priceAboveOffer.status).toBe(400); // the stored regularPrice is 499
    expect((await ctx.api.get("/api/admin/products/not-there").set(auth)).status).toBe(404);
    expect((await ctx.api.get("/api/admin/products/64b64b64b64b64b64b64b64b").set(auth)).status).toBe(404);
  });
});

describe("admin categories", () => {
  it("creates, renames and deletes a category, removing it from products", async () => {
    const created = await ctx.api.post("/api/admin/categories").set(auth).send({ slug: "gifts", name: "Gifts" }).expect(201);
    await Product.updateOne({ slug: "aloe-pure-shampoo" }, { $push: { categories: { category: "gifts", position: 0 } } });
    expect((await ctx.api.get("/api/categories")).body.items.map((c: { slug: string }) => c.slug)).toContain("gifts");

    await ctx.api.patch(`/api/admin/categories/${created.body.category.id}`).set(auth).send({ name: "Gift Sets", description: "Boxed" }).expect(200);
    expect((await Category.findOne({ slug: "gifts" }))?.name).toBe("Gift Sets");

    await ctx.api.delete("/api/admin/categories/gifts").set(auth).expect(204);
    const product = await Product.findOne({ slug: "aloe-pure-shampoo" }).lean();
    expect(product?.categories.some((c) => c.category === "gifts")).toBe(false);
    expect((await ctx.api.post("/api/admin/categories").set(auth).send({ slug: "hair", name: "Dup" })).status).toBe(409);
  });
});

describe("admin coupons", () => {
  it("creates, edits and removes coupons", async () => {
    const created = await ctx.api.post("/api/admin/coupons").set(auth).send({ code: "welcome10", type: "percent", value: 10, expiresAt: "2030-01-01" }).expect(201);
    expect(created.body.coupon).toMatchObject({ code: "WELCOME10", type: "percent", value: 10, usedCount: 0, isActive: true });

    expect((await ctx.api.post("/api/admin/coupons").set(auth).send({ code: "WELCOME10", type: "fixed", value: 5 })).status).toBe(409);
    expect((await ctx.api.post("/api/admin/coupons").set(auth).send({ code: "BIG", type: "percent", value: 150 })).status).toBe(400);
    expect((await ctx.api.post("/api/admin/coupons").set(auth).send({ code: "x", type: "percent", value: 5 })).status).toBe(400);

    const patched = await ctx.api.patch("/api/admin/coupons/WELCOME10").set(auth).send({ value: 15, expiresAt: null, usageLimit: 100 }).expect(200);
    expect(patched.body.coupon).toMatchObject({ value: 15, usageLimit: 100 });
    expect(patched.body.coupon.expiresAt).toBeUndefined();
    expect((await ctx.api.patch("/api/admin/coupons/WELCOME10").set(auth).send({ value: 500 })).status).toBe(400);

    expect((await ctx.api.get("/api/admin/coupons").set(auth)).body.total).toBe(1);
    await ctx.api.delete("/api/admin/coupons/welcome10").set(auth).expect(204);
    expect(await Coupon.countDocuments()).toBe(0);
  });
});

describe("admin orders and stats", () => {
  async function placeOrder(paid: boolean) {
    const placed = (await ctx.api.post("/api/orders").send({ items: [{ slug: "aloe-pure-shampoo", qty: 2 }], email: "buyer@example.com", shipping: validAddress })).body;
    if (paid) {
      const rzp = placed.payment.razorpayOrderId as string;
      await ctx.api
        .post(`/api/orders/${placed.order.number}/verify-payment`)
        .set("X-Order-Token", placed.accessToken)
        .send({ razorpay_order_id: rzp, razorpay_payment_id: "pay_1", razorpay_signature: paymentSignature(rzp, "pay_1") })
        .expect(200);
    }
    return { number: placed.order.number as number, token: placed.accessToken as string };
  }

  it("summarises the shop for the dashboard", async () => {
    await Order.deleteMany({});
    await placeOrder(true);
    await placeOrder(true);
    await placeOrder(false);
    const { body } = await ctx.api.get("/api/admin/stats").set(auth).expect(200);
    expect(body.orders).toEqual({ paid: 2, awaitingPayment: 1, refunded: 0, toShip: 2 });
    expect(body.revenue).toEqual({ total: 2396, paidOrders: 2, currency: "INR" });
    expect(body.products.active).toBe(25);
  });
});

describe("admin image uploads", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46]);

  it("sends a photo to the image store and returns its address", async () => {
    const response = await ctx.api.post("/api/admin/uploads").set(auth).attach("file", jpeg, { filename: "a.jpg", contentType: "image/jpeg" }).expect(201);
    expect(response.body).toMatchObject({ url: expect.stringContaining("res.cloudinary.com"), publicId: "bhumiblend/new-photo" });
    expect(store.uploaded).toEqual([jpeg.length]);
  });

  it("refuses non-images, missing files and huge files", async () => {
    const text = await ctx.api.post("/api/admin/uploads").set(auth).attach("file", Buffer.from("hello"), { filename: "a.txt", contentType: "text/plain" });
    expect(text.status).toBe(415);
    expect(text.body.error.code).toBe("UNSUPPORTED_FILE");
    expect((await ctx.api.post("/api/admin/uploads").set(auth)).status).toBe(400);
    const big = await ctx.api.post("/api/admin/uploads").set(auth).attach("file", Buffer.alloc(5 * 1024 * 1024 + 10), { filename: "big.jpg", contentType: "image/jpeg" });
    expect(big.status).toBe(413);
    expect(store.uploaded).toHaveLength(1); // none of those reached the store
  });

  it("needs a login", async () => {
    const response = await ctx.api.post("/api/admin/uploads").attach("file", jpeg, { filename: "a.jpg", contentType: "image/jpeg" });
    expect(response.status).toBe(401);
    expect(store.uploaded).toHaveLength(1);
  });

  it("deletes a photo by its id", async () => {
    await ctx.api.delete("/api/admin/uploads").query({ publicId: "bhumiblend/new-photo" }).set(auth).expect(204);
    expect(store.removed).toEqual(["bhumiblend/new-photo"]);
    expect((await ctx.api.delete("/api/admin/uploads").set(auth)).status).toBe(400);
  });
});

describe("one coupon", () => {
  it("can be fetched by code or id for the edit screen", async () => {
    const created = await ctx.api.post("/api/admin/coupons").set(auth).send({ code: "fetchme", type: "fixed", value: 25 }).expect(201);
    const byCode = await ctx.api.get("/api/admin/coupons/fetchme").set(auth).expect(200);
    expect(byCode.body.coupon).toMatchObject({ code: "FETCHME", type: "fixed", value: 25 });
    const byId = await ctx.api.get(`/api/admin/coupons/${created.body.coupon.id}`).set(auth).expect(200);
    expect(byId.body.coupon.code).toBe("FETCHME");
    expect((await ctx.api.get("/api/admin/coupons/nothing-here").set(auth)).status).toBe(404);
    await ctx.api.delete("/api/admin/coupons/fetchme").set(auth).expect(204);
  });
});
