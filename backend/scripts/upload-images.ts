// One-off migration: upload the storefront's product photos (frontend/public)
// to Cloudinary and point the database at the new addresses.
//
//   npm run images:upload -- --dry-run   list what would be uploaded (no keys needed for this part)
//   npm run images:upload                upload, then update the products
//
// Needs MONGODB_URI and the three CLOUDINARY_* keys in backend/.env. Safe to
// repeat: photos already on Cloudinary are skipped, and each photo is uploaded
// once even when many products use it (the id comes from its file name).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { connectDb, disconnectDb } from "../src/config/db.js";
import { loadEnv } from "../src/config/env.js";
import { Product } from "../src/models/Product.js";
import { createCloudinaryStore } from "../src/services/images.js";
import { collectLocalImagePaths, publicIdFor, replaceLocalImagePaths } from "./lib/image-paths.js";

dotenv.config({ quiet: true });

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../frontend/public");
const dryRun = process.argv.includes("--dry-run");

const env = loadEnv();
await connectDb(env.MONGODB_URI);

// Plain objects (.lean()), not live Mongoose documents: we only read here and write back with updateOne.
const products = await Product.find().lean();
const paths = new Set<string>();
for (const product of products) {
  collectLocalImagePaths([product.image, product.hoverImage, product.details], paths);
}

const onDisk = (local: string) => path.join(publicDir, decodeURIComponent(local));
const missing = [...paths].filter((local) => !fs.existsSync(onDisk(local)));
console.log(`${products.length} products use ${paths.size} different local photos; ${missing.length} not found in frontend/public.`);
for (const local of missing) console.log(`  missing: ${local}`);

if (dryRun) {
  console.log("Dry run — nothing uploaded.");
  await disconnectDb();
  process.exit(0);
}

const store = createCloudinaryStore(env);
if (!store.configured) {
  console.error("Cloudinary keys are missing: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend/.env.");
  await disconnectDb();
  process.exit(1);
}

const urls = new Map<string, string>();
const ids = new Map<string, string>();
let done = 0;
for (const local of paths) {
  if (missing.includes(local)) continue;
  const stored = await store.uploadFile(onDisk(local), { publicId: publicIdFor(local) });
  urls.set(local, stored.url);
  ids.set(local, stored.publicId);
  done += 1;
  if (done % 20 === 0) console.log(`  uploaded ${done}/${paths.size - missing.length}`);
}
console.log(`Uploaded ${done} photos.`);

for (const product of products) {
  const swap = (image: { url: string; publicId?: string | null }) =>
    urls.has(image.url) ? { url: urls.get(image.url)!, publicId: ids.get(image.url)! } : image;
  const $set: Record<string, unknown> = { image: swap(product.image) };
  if (product.hoverImage) $set.hoverImage = swap(product.hoverImage);
  if (product.details) $set.details = replaceLocalImagePaths(product.details, urls);
  await Product.updateOne({ _id: product._id }, { $set });
}
console.log(`Updated ${products.length} products.`);
await disconnectDb();
