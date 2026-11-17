/**
 * Starts a real local PostgreSQL server (embedded-postgres binaries, no install,
 * no Docker). Data lives in ./.pgdata and persists across restarts.
 * Listens on localhost only. Keep this process running while using the app.
 */
import "dotenv/config";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const url = new URL(process.env.DATABASE_URL ?? "");
if (!url.password) {
  console.error("DATABASE_URL missing. Run: npm run setup:env");
  process.exit(1);
}
const dir = resolve(process.cwd(), ".pgdata");
const fresh = !existsSync(resolve(dir, "PG_VERSION"));

const pg = new EmbeddedPostgres({
  databaseDir: dir,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  port: Number(url.port),
  persistent: true,
  // Windows would otherwise default to WIN1252; the catalog needs real UTF-8.
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  postgresFlags: ["-c", "listen_addresses=127.0.0.1"],
});

async function main() {
  if (fresh) await pg.initialise();
  await pg.start();
  const db = url.pathname.slice(1);
  try {
    await pg.createDatabase(db);
    console.log(`Created database "${db}".`);
  } catch {
    /* already exists */
  }
  console.log(`PostgreSQL ready on 127.0.0.1:${url.port} (db: ${db}). Ctrl+C to stop.`);
}

async function stop() {
  console.log("\nStopping PostgreSQL…");
  await pg.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
