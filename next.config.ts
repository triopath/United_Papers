import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ngrok's public host must be allowed or the dev server will not serve the
  // client bundle, and the admin form falls back to a GET that never logs in.
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app", "*.ngrok.io"],
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
