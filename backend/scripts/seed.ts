// Load the storefront's products and categories into MongoDB.
//
//   npm run seed            add anything missing, never overwrite
//   npm run seed -- --reset wipe products + categories first, then load

import dotenv from "dotenv";
import { connectDb, disconnectDb } from "../src/config/db.js";
import { loadEnv } from "../src/config/env.js";
import { seedCatalogue } from "./lib/seed-catalogue.js";

dotenv.config({ quiet: true });

const env = loadEnv();
await connectDb(env.MONGODB_URI);
const reset = process.argv.includes("--reset");
if (reset) console.log("--reset: clearing products and categories first.");

const result = await seedCatalogue({ reset });
console.log(`Categories: ${result.categories.added} added, ${result.categories.kept} already there.`);
console.log(`Products:   ${result.products.added} added, ${result.products.kept} already there.`);
await disconnectDb();
