import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The admin panel runs on port 3001 (the storefront uses 3000). The backend lets
// both through (CLIENT_ORIGINS in backend/.env), so keep this port fixed.
export default defineConfig({
  plugins: [react()],
  server: { port: 3001, strictPort: true },
  preview: { port: 3001, strictPort: true },
});
