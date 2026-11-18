import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ngrok's public host must be allowed or the dev server will not serve the
  // client bundle, and the admin form falls back to a GET that never logs in.
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app", "*.ngrok.io"],
  // This demo is fully dynamic (live DB reads, cookies). Opt out of Cache Components so
  // routes render per-request instead of requiring a Suspense boundary around every query.
  cacheComponents: false,
  // Keep optimized images for a day instead of re-checking every minute.
  images: { minimumCacheTTL: 86400 },
  async headers() {
    return [
      // Product/brand photos change rarely: let browsers (and ngrok/CDN) reuse them.
      { source: "/products/:file*.webp", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
      { source: "/brand/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
    ];
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
