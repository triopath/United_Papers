import { execSync } from "node:child_process";
import { Client } from "pg";

/** Creates the *_test database if needed and applies all migrations to it. */
export default async function setup() {
  const url = new URL(process.env.DATABASE_URL!);
  const dbName = url.pathname.slice(1);
  if (!dbName.endsWith("_test")) throw new Error(`Refusing to run tests against non-test DB "${dbName}"`);

  const admin = new URL(url.toString());
  admin.pathname = "/postgres";
  const client = new Client({ connectionString: admin.toString() });
  try {
    await client.connect();
  } catch {
    throw new Error("PostgreSQL is not reachable. Start it first: npm run db:start");
  }
  const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (exists.rowCount === 0) await client.query(`CREATE DATABASE "${dbName}"`);
  await client.end();

  execSync("npx prisma migrate deploy", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: url.toString() },
  });
}
