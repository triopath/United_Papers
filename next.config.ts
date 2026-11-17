import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // This demo is fully dynamic (live DB reads, cookies). Opt out of Cache Components so
  // routes render per-request instead of requiring a Suspense boundary around every query.
  cacheComponents: false,
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
