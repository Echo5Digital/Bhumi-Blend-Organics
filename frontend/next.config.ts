import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Product photos uploaded from the admin panel live on Cloudinary.
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] },
  // The admin panel lives in src/admin and is served at /adminecho5 by src/app/adminecho5, so it is
  // built and deployed together with the shop: there is nothing separate to build.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
