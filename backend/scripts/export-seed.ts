// One-off: turns the storefront's hard-coded catalogue (frontend/src/data) into
// backend/seed/catalogue.json, which `npm run seed` loads into MongoDB.
//
//   npm run seed:export
//
// Run it again only if the storefront's data files change before the database
// takes over as the source of truth. The generated JSON is committed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

type FrontProduct = {
  slug: string;
  name: string;
  image: string;
  hoverImage: string;
  price: number;
  regularPrice?: number;
  rating?: number;
};
type FrontDetail = { slug: string; sku?: string; weight?: string; [key: string]: unknown };
type FrontCategory = { slug: string; heading: string; headingAccent: string; intro: string; products: FrontProduct[] };

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, "../../frontend/src/data");
const load = <T>(file: string) => import(pathToFileURL(path.join(dataDir, file)).href) as Promise<T>;

const productsModule = await load<{
  bestSellers: FrontProduct[];
  shopProducts: FrontProduct[];
  skinCareEssentials: FrontProduct[];
  catalogue: FrontProduct[];
}>("products.ts");
const detailsModule = await load<{ productDetails: FrontDetail[] }>("productDetails.ts");
const categoriesModule = await load<{ categories: FrontCategory[] }>("categories.ts");

const { bestSellers, shopProducts, skinCareEssentials, catalogue } = productsModule;
const { productDetails } = detailsModule;
const { categories } = categoriesModule;

// ---- merge the lists: one product per slug -------------------------------
// The same product appears in several storefront lists (shop, home rows,
// category pages). The shop's entry is the canonical one (it is what the cart
// and wishlist use); stars come from wherever the live site showed them.
const everyEntry = new Map<string, FrontProduct[]>();
for (const list of [shopProducts, ...categories.map((c) => c.products), bestSellers, skinCareEssentials]) {
  for (const entry of list) everyEntry.set(entry.slug, [...(everyEntry.get(entry.slug) ?? []), entry]);
}

const warnings: string[] = [];
for (const [slug, entries] of everyEntry) {
  for (const field of ["name", "price", "regularPrice"] as const) {
    const values = new Set(entries.map((entry) => entry[field]));
    if (values.size > 1) warnings.push(`${slug}: "${field}" differs between lists: ${[...values].join(" | ")}`);
  }
}

const shopOrder = new Map(shopProducts.map((product, index) => [product.slug, index]));
const detailBySlug = new Map(productDetails.map((detail) => [detail.slug, detail]));

const productsOut = catalogue.map((card, index) => {
  const entries = everyEntry.get(card.slug) ?? [card];
  const rating = entries.find((entry) => entry.rating !== undefined)?.rating;
  const { slug: _slug, sku, weight, ...details } = detailBySlug.get(card.slug) ?? ({} as FrontDetail);
  const hasDetails = detailBySlug.has(card.slug);

  return {
    slug: card.slug,
    name: card.name,
    sku,
    price: card.price,
    regularPrice: card.regularPrice,
    image: { url: card.image },
    hoverImage: { url: card.hoverImage },
    rating,
    weight,
    // Products only on the home page (no shop entry) go after the shop list.
    position: shopOrder.get(card.slug) ?? shopProducts.length + index,
    categories: categories.flatMap((category) => {
      const at = category.products.findIndex((entry) => entry.slug === card.slug);
      return at === -1 ? [] : [{ category: category.slug, position: at }];
    }),
    collections: [
      ...bestSellers.flatMap((entry, at) => (entry.slug === card.slug ? [{ key: "best-sellers", position: at }] : [])),
      ...skinCareEssentials.flatMap((entry, at) =>
        entry.slug === card.slug ? [{ key: "skin-care-essentials", position: at }] : [],
      ),
    ],
    inStock: true,
    isActive: true,
    details: hasDetails ? details : undefined,
  };
});

// Frontend category slugs → display names (the header menu calls "face" Skin Care).
const categoryNames: Record<string, string> = { hair: "Hair Care", face: "Skin Care", body: "Body Care", combo: "Combo" };
const categoriesOut = categories.map((category, position) => ({
  slug: category.slug,
  name: categoryNames[category.slug] ?? category.heading,
  description: category.intro,
  position,
  isActive: true,
}));

const outDir = path.resolve(here, "../seed");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "catalogue.json"), JSON.stringify({ categories: categoriesOut, products: productsOut }, null, 2) + "\n");

const withDetails = productsOut.filter((product) => product.details).length;
console.log(`Wrote seed/catalogue.json: ${categoriesOut.length} categories, ${productsOut.length} products (${withDetails} with page content).`);
console.log(`Products by category: ${categoriesOut.map((c) => `${c.slug}=${productsOut.filter((p) => p.categories.some((x) => x.category === c.slug)).length}`).join(", ")}`);
if (warnings.length > 0) {
  console.log(`\n${warnings.length} difference(s) between storefront lists (the shop's value was used):`);
  for (const warning of warnings) console.log("  - " + warning);
}
