/**
 * Connection diagnostic for a hosted database. Never prints the password.
 *   $env:DATABASE_URL = "<string>"; npm run db:check
 */
import { Client } from "pg";

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("Set $env:DATABASE_URL first.");
  process.exit(1);
}

let url: URL;
try {
  url = new URL(raw);
} catch {
  console.error("DATABASE_URL is not a valid URL. Common cause: special characters in the password (use letters/numbers only), or leftover [ ] brackets.");
  process.exit(1);
}

console.log("host    :", url.hostname);
console.log("port    :", url.port || "(default 5432)");
console.log("database:", url.pathname.slice(1) || "(none)");
console.log("user    :", decodeURIComponent(url.username), url.hostname.includes("pooler.supabase.com") && !url.username.startsWith("postgres.") ? "  <-- pooler users must look like postgres.<project-ref>" : "");
console.log("password:", url.password ? `${"*".repeat(Math.min(url.password.length, 8))} (${url.password.length} chars)` : "MISSING");
if (/[\[\]]/.test(raw)) console.log("WARNING: the string still contains [ or ] — remove the brackets around the password.");

url.searchParams.delete("sslmode");
url.searchParams.delete("pgbouncer");
const client = new Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });

client
  .connect()
  .then(() => client.query("select current_database() db, version() v"))
  .then((r) => {
    console.log("\nCONNECTED OK ->", r.rows[0].db);
    return client.end();
  })
  .catch((e: Error & { code?: string }) => {
    console.error(`\nFAILED: [${e.code ?? "no code"}] ${e.message}`);
    process.exit(1);
  });
