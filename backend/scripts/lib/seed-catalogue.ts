import fs from "node:fs";
import { Category } from "../../src/models/Category.js";
import { Product } from "../../src/models/Product.js";

// Loads seed/catalogue.json (made by `npm run seed:export`) into MongoDB.
//
// Safe to run again: without `reset` it only ADDS categories and products whose
// slug isn't in the database yet, and never touches ones that are — so edits
// made in the admin panel survive. `reset` wipes categories and products first
// (orders, coupons and admins are left alone).

type SeedRow = { slug: string };
type SeedFile = { categories: SeedRow[]; products: SeedRow[] };

/** Insert the rows whose slug isn't taken yet; Mongoose validates each one as it goes in. */
async function insertMissing(rows: SeedRow[], existingSlugs: string[], insert: (fresh: SeedRow[]) => Promise<unknown>) {
  const taken = new Set(existingSlugs);
  const fresh = rows.filter((row) => !taken.has(row.slug));
  if (fresh.length > 0) await insert(fresh);
  return { added: fresh.length, kept: rows.length - fresh.length };
}

export async function seedCatalogue({ reset = false }: { reset?: boolean } = {}) {
  const seed = JSON.parse(fs.readFileSync(new URL("../../seed/catalogue.json", import.meta.url), "utf8")) as SeedFile;

  if (reset) await Promise.all([Category.deleteMany({}), Product.deleteMany({})]);

  const categorySlugs = (await Category.find({}, { slug: 1 }).lean()).map((row) => row.slug);
  const productSlugs = (await Product.find({}, { slug: 1 }).lean()).map((row) => row.slug);

  return {
    categories: await insertMissing(seed.categories, categorySlugs, (fresh) => Category.insertMany(fresh as never)),
    products: await insertMissing(seed.products, productSlugs, (fresh) => Product.insertMany(fresh as never)),
  };
}
