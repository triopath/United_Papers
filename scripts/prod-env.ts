/**
 * Generates production secrets for Vercel.
 * The admin password hash is copied from local .env when that file exists.
 *   npm run prod:env
 * Writes prod-env.local.txt (gitignored). Open it, paste the lines into Vercel
 * (Settings -> Environment Variables -> Import .env), then delete the file.
 * Nothing secret is printed to the terminal.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";

function localAdminHash(): string | null {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8").match(/^ADMIN_PASSWORD_HASH=".*"$/m)?.[0] ?? null;
}

const reused = localAdminHash();
const password = randomBytes(12).toString("base64url");
const body = [
  "# Paste into Vercel -> Settings -> Environment Variables -> Import .env, then DELETE this file.",
  "# Fill DATABASE_URL with your Supabase TRANSACTION pooler string (port 6543).",
  'DATABASE_URL="PASTE_SUPABASE_TRANSACTION_POOLER_URL_HERE"',
  `SESSION_SECRET="${randomBytes(48).toString("hex")}"`,
  'ADMIN_EMAIL="owner@unitedpapers.demo"',
  reused ?? `ADMIN_PASSWORD_HASH="${bcrypt.hashSync(password, 12)}"`,
  'NEXT_PUBLIC_DEMO_BANNER="true"',
  "",
  reused
    ? "# Admin login password for the live site is the same password as your local .env."
    : `# Admin login password for the live site (keep private): ${password}`,
  "",
].join("\n");

writeFileSync(resolve(process.cwd(), "prod-env.local.txt"), body, "utf8");
console.log("Wrote prod-env.local.txt (gitignored). Open it to copy the values. Nothing secret was printed here.");
