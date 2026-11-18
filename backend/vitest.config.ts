import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // Each test file starts its own in-memory MongoDB; the very first run downloads it.
    hookTimeout: 300_000,
    testTimeout: 30_000,
  },
});
