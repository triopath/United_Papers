import "dotenv/config";
import { defineConfig } from "vitest/config";
import path from "node:path";

// Tests NEVER touch the demo database: they use a sibling database named *_test.
const base = new URL(process.env.DATABASE_URL ?? "postgresql://u:p@localhost:54329/unitedpapers");
base.pathname = "/unitedpapers_test";
const testUrl = base.toString();
// Applies to global setup (main process) and is inherited by test workers.
process.env.DATABASE_URL = testUrl;
process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-test-secret-123456";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/empty.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    testTimeout: 30000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});