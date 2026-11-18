import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Category } from "../src/models/Category.js";
import { Order } from "../src/models/Order.js";
import { Product } from "../src/models/Product.js";
import { seedCatalogue } from "../scripts/lib/seed-catalogue.js";
import { startTestApp } from "./helpers.js";

let ctx: Awaited<ReturnType<typeof startTestApp>>;
beforeAll(async () => {
  ctx = await startTestApp({ seed: false });
});
afterAll(() => ctx.stop());

describe("seeding the catalogue", () => {
  it("loads the storefront's products and categories", async () => {
    const result = await seedCatalogue();
    expect(result).toEqual({ categories: { added: 4, kept: 0 }, products: { added: 25, kept: 0 } });
    expect(await Product.countDocuments()).toBe(25);
    expect(await Category.countDocuments()).toBe(4);
  });

  it("never overwrites what's already there, only adds what's missing", async () => {
    await Product.updateOne({ slug: "aloe-pure-shampoo" }, { price: 1, name: "Edited in admin" });
    await Product.deleteOne({ slug: "gua-sha-face-tool" });
    const result = await seedCatalogue();
    expect(result.products).toEqual({ added: 1, kept: 24 });
    const edited = await Product.findOne({ slug: "aloe-pure-shampoo" });
    expect(edited).toMatchObject({ price: 1, name: "Edited in admin" });
  });

  it("--reset starts over but leaves orders alone", async () => {
    await Order.collection.insertOne({ number: 1 });
    const result = await seedCatalogue({ reset: true });
    expect(result.products).toEqual({ added: 25, kept: 0 });
    expect((await Product.findOne({ slug: "aloe-pure-shampoo" }))?.price).toBe(599);
    expect(await Order.collection.countDocuments()).toBe(1);
  });

  it("gives every product valid prices, photos and positions", async () => {
    for (const product of await Product.find().lean()) {
      expect(product.price, product.slug).toBeGreaterThan(0);
      if (product.regularPrice != null) expect(product.regularPrice, product.slug).toBeGreaterThan(product.price);
      expect(product.image.url, product.slug).toMatch(/^\//);
      expect(product.details, product.slug).toBeTruthy();
    }
    const positions = (await Product.find().lean()).map((p) => p.position);
    expect(new Set(positions).size).toBe(positions.length); // every product has its own place in the shop order
  });
});
