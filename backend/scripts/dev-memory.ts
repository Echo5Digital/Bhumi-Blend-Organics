// Run the API against a throwaway, in-memory MongoDB — no database link needed.
//
//   npm run dev:memory
//
// It starts MongoDB inside this process, loads the catalogue, creates a demo
// admin and serves the API on PORT (default 4000). Everything is gone when you
// stop it. Payments and image uploads stay "not configured" unless you've put
// Razorpay / Cloudinary keys in backend/.env.

import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { connectDb } from "../src/config/db.js";
import { loadEnv } from "../src/config/env.js";
import { upsertAdmin } from "./lib/admin.js";
import { seedCatalogue } from "./lib/seed-catalogue.js";

dotenv.config({ quiet: true });

console.log("Starting an in-memory MongoDB (the first run downloads it, which can take a minute)...");
const mongo = await MongoMemoryServer.create();

const env = loadEnv({
  ...process.env,
  MONGODB_URI: mongo.getUri("bhumiblend"),
  JWT_SECRET: process.env.JWT_SECRET || "dev-only-secret-dev-only-secret-dev-only-secret",
});
await connectDb(env.MONGODB_URI);

const seeded = await seedCatalogue();
const demoAdmin = { email: "admin@bhumiblend.local", name: "Demo Admin", password: "demo-password-123" };
await upsertAdmin(demoAdmin);

const server = createApp({ env }).listen(env.PORT, () => {
  console.log(`\nAPI:      http://localhost:${env.PORT}/api/health`);
  console.log(`Catalogue: ${seeded.products.added} products, ${seeded.categories.added} categories`);
  console.log(`Admin:    ${demoAdmin.email} / ${demoAdmin.password}`);
  console.log("Data lives in memory only and disappears when you stop this.");
});

const stop = async () => {
  server.close();
  await mongo.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
