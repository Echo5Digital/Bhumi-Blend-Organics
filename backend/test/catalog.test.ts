import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Product } from "../src/models/Product.js";
import { startTestApp } from "./helpers.js";

let ctx: Awaited<ReturnType<typeof startTestApp>>;
beforeAll(async () => {
  ctx = await startTestApp();
});
afterAll(() => ctx.stop());

describe("health", () => {
  it("reports the database and which services are configured", async () => {
    const response = await ctx.api.get("/api/health").expect(200);
    expect(response.body).toMatchObject({ status: "ok", database: true });
  });
});

describe("categories", () => {
  it("lists the four categories in menu order", async () => {
    const { body } = await ctx.api.get("/api/categories").expect(200);
    expect(body.items.map((c: { slug: string }) => c.slug)).toEqual(["hair", "face", "body", "combo"]);
    expect(body.items[1].name).toBe("Skin Care");
  });
});

describe("products list", () => {
  it("returns every active product as storefront-shaped cards", async () => {
    const { body } = await ctx.api.get("/api/products?limit=100").expect(200);
    expect(body.total).toBe(25);
    expect(body.items).toHaveLength(25);
    const hairOil = body.items.find((p: { slug: string }) => p.slug === "best-ayurvedic-hair-oil");
    expect(hairOil).toEqual({
      slug: "best-ayurvedic-hair-oil",
      name: "Bhumi Blend Pure Ayurvedic Hair Oil",
      image: "/Hair-Oil-Organic.jpg",
      hoverImage: "/Hair-Oil-2_05-1-500x669.jpg",
      price: 399,
      regularPrice: 499,
      rating: 4,
      weight: "200ml",
      inStock: true,
    });
  });

  it("keeps the shop's own order by default", async () => {
    const { body } = await ctx.api.get("/api/products?limit=3").expect(200);
    expect(body.items.map((p: { slug: string }) => p.slug)).toEqual([
      "best-organic-body-lotion-for-dry-skin",
      "aloe-pure-shampoo",
      "ayurvedic-anti-aging-cream",
    ]);
  });

  it("filters by category and uses that category page's order", async () => {
    const { body } = await ctx.api.get("/api/products?category=hair").expect(200);
    expect(body.total).toBe(5);
    expect(body.items[0].slug).toBe("aloe-pure-shampoo");
    expect(body.items[1].slug).toBe("best-ayurvedic-hair-oil");
  });

  it("filters by home-page collection in its row order", async () => {
    const { body } = await ctx.api.get("/api/products?collection=best-sellers").expect(200);
    expect(body.total).toBe(8);
    expect(body.items[0].slug).toBe("buy-pure-aloe-vera-gel");
    expect(body.items[1].slug).toBe("best-ayurvedic-hair-oil");
  });

  it("sorts by price both ways", async () => {
    const asc = (await ctx.api.get("/api/products?sort=price-asc&limit=100")).body.items.map((p: { price: number }) => p.price);
    const desc = (await ctx.api.get("/api/products?sort=price-desc&limit=100")).body.items.map((p: { price: number }) => p.price);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });

  it("searches names, ignoring case and regex characters", async () => {
    const { body } = await ctx.api.get("/api/products?search=SERUM").expect(200);
    expect(body.total).toBeGreaterThan(0);
    for (const item of body.items) expect(item.name.toLowerCase()).toContain("serum");
    await ctx.api.get("/api/products?search=" + encodeURIComponent("(((")).expect(200);
  });

  it("paginates", async () => {
    const page1 = (await ctx.api.get("/api/products?limit=9&page=1")).body;
    const page3 = (await ctx.api.get("/api/products?limit=9&page=3")).body;
    expect(page1).toMatchObject({ page: 1, limit: 9, total: 25, pages: 3 });
    expect(page1.items).toHaveLength(9);
    expect(page3.items).toHaveLength(7);
  });

  it("rejects nonsense query values", async () => {
    const response = await ctx.api.get("/api/products?limit=abc&sort=cheapest").expect(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("hides inactive products", async () => {
    await Product.updateOne({ slug: "aloe-pure-shampoo" }, { isActive: false });
    const { body } = await ctx.api.get("/api/products?limit=100").expect(200);
    expect(body.total).toBe(24);
    await ctx.api.get("/api/products/aloe-pure-shampoo").expect(404);
    await Product.updateOne({ slug: "aloe-pure-shampoo" }, { isActive: true });
  });
});

describe("product page", () => {
  it("returns the page content with related products resolved", async () => {
    const { body } = await ctx.api.get("/api/products/best-ayurvedic-hair-oil").expect(200);
    expect(body.name).toBe("Bhumi Blend Pure Ayurvedic Hair Oil");
    expect(body.weight).toBe("200ml");
    expect(body.sku).toBe("BB-HC-AHT-200");
    expect(body.categories).toEqual(["hair"]);
    expect(body.details.description.length).toBeGreaterThan(0);
    expect(body.details.gallery.length).toBeGreaterThan(0);
    expect(body.related.length).toBeGreaterThan(0);
    expect(body.related[0]).toHaveProperty("price");
  });

  it("resolves a kit's contents", async () => {
    const kit = await Product.findOne({ "details.bundle.0": { $exists: true } }).lean();
    expect(kit).toBeTruthy();
    const { body } = await ctx.api.get(`/api/products/${kit!.slug}`).expect(200);
    expect(body.bundle.length).toBeGreaterThan(0);
    expect(body.bundle[0]).toMatchObject({ quantity: expect.any(Number), product: { slug: expect.any(String) } });
  });

  it("answers 404 for an unknown product", async () => {
    const response = await ctx.api.get("/api/products/no-such-thing").expect(404);
    expect(response.body.error.code).toBe("PRODUCT_NOT_FOUND");
  });
});

describe("general", () => {
  it("answers unknown routes with JSON 404", async () => {
    const response = await ctx.api.get("/api/nope").expect(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("answers bad JSON with a clean 400", async () => {
    const response = await ctx.api.post("/api/orders").set("Content-Type", "application/json").send("{oops").expect(400);
    expect(response.body.error.code).toBe("INVALID_JSON");
  });

  // A browser asks permission ("preflight") before any call that isn't a plain GET/POST.
  // If a method is missing here the call never leaves the browser, and the page just
  // says it "couldn't reach the store" — which tests that skip preflight never notice.
  it.each(["GET", "POST", "PUT", "PATCH", "DELETE"])("lets the storefront's browser use %s", async (method) => {
    const response = await ctx.api
      .options("/api/account/addresses/shipping")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", method)
      .set("Access-Control-Request-Headers", "content-type,authorization,x-order-token");
    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-methods"]).toContain(method);
    expect(response.headers["access-control-allow-headers"]?.toLowerCase()).toContain("authorization");
  });

  it("only allows the configured websites to call it from a browser", async () => {
    const allowed = await ctx.api.get("/api/health").set("Origin", "http://localhost:3000");
    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    const denied = await ctx.api.get("/api/health").set("Origin", "https://evil.example");
    expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
