import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDb, disconnectDb } from "./config/db.js";
import { loadEnv } from "./config/env.js";

dotenv.config({ quiet: true });

async function main() {
  const env = loadEnv();
  await connectDb(env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const app = createApp({ env });
  const server = app.listen(env.PORT, () => {
    console.log(`Bhumi Blend API listening on http://localhost:${env.PORT}`);
  });

  // Let in-flight requests finish before the host stops the process.
  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down.`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
