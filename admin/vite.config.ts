import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The admin panel is served by the storefront at /adminecho5 (http://localhost:3000/adminecho5).
// `npm run build` writes the finished app into ../frontend/public/adminecho5, and the storefront's
// next.config.ts sends every address under /adminecho5 to it. The base path below must match.
//
// `npm run dev` still starts a stand-alone copy with hot reload at http://localhost:3001/adminecho5/
// for working on the admin itself; the backend allows that address too (CLIENT_ORIGINS).
export default defineConfig({
  base: "/adminecho5/",
  plugins: [react()],
  build: { outDir: "../frontend/public/adminecho5", emptyOutDir: true },
  server: { port: 3001, strictPort: true },
  preview: { port: 3001, strictPort: true },
});
