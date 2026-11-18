/**
 * Generates a FRESH SESSION_SECRET for Vercel (never reuse your local one).
 *   npm run prod:env
 * Writes prod-env.local.txt (gitignored). Paste the lines into Vercel
 * (Settings -> Environment Variables -> Import .env), then delete the file.
 * Admin logins are database users (npm run admin:create), so there is no admin password here.
 */
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const body = [
  "# Paste into Vercel -> Settings -> Environment Variables -> Import .env, then DELETE this file.",
  "# Fill DATABASE_URL with your Supabase TRANSACTION pooler string (port 6543); encode @ in the password as %40.",
  'DATABASE_URL="PASTE_SUPABASE_TRANSACTION_POOLER_URL_HERE"',
  `SESSION_SECRET="${randomBytes(48).toString("hex")}"`,
  'NEXT_PUBLIC_DEMO_BANNER="true"',
  "",
].join("\n");

writeFileSync(resolve(process.cwd(), "prod-env.local.txt"), body, "utf8");
console.log("Wrote prod-env.local.txt (gitignored). Nothing secret was printed here.");
