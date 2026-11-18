import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Product photos uploaded from the admin panel live on Cloudinary.
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] },
  // The admin panel (../admin) is a built single-page app that lives in public/adminecho5
  // (`npm run build` in admin/ puts it there). Real files (its scripts, styles, logo) are served
  // as they are; any other address under /adminecho5 (e.g. /adminecho5/orders) opens the app,
  // which then shows the right screen itself.
  async rewrites() {
    return [{ source: "/adminecho5/:path*", destination: "/adminecho5/index.html" }];
  },
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
