// Create an admin-panel login (or reset an existing one's password).
//
//   npm run admin:create -- --email you@example.com --name "Your Name" --password "a-long-password"
//
// Leave --password out and a random one is generated and printed once.

import crypto from "node:crypto";
import dotenv from "dotenv";
import { connectDb, disconnectDb } from "../src/config/db.js";
import { loadEnv } from "../src/config/env.js";
import { upsertAdmin } from "./lib/admin.js";

dotenv.config({ quiet: true });

function flag(name: string): string | undefined {
  const at = process.argv.indexOf(`--${name}`);
  return at === -1 ? undefined : process.argv[at + 1];
}

const email = flag("email");
const name = flag("name") ?? "Admin";
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run admin:create -- --email you@example.com --name "Your Name" [--password "..."]');
  process.exit(1);
}
const generated = !flag("password");
const password = flag("password") ?? crypto.randomBytes(12).toString("base64url");

await connectDb(loadEnv().MONGODB_URI);
try {
  const { created } = await upsertAdmin({ email, name, password });
  console.log(`${created ? "Created" : "Updated"} admin ${email.toLowerCase()}.`);
  if (generated) console.log(`Generated password (shown once, save it now): ${password}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await disconnectDb();
}
