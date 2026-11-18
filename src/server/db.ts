import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Local PostgreSQL: plain connection. Hosted (Supabase/Neon/…): TLS on, and a small
 * pool per serverless instance so many Vercel instances don't exhaust the database.
 */
function poolConfig(raw: string) {
  const url = new URL(raw);
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  // node-postgres lets `sslmode` in the URL override the `ssl` option, so strip it and set TLS explicitly.
  url.searchParams.delete("sslmode");
  url.searchParams.delete("pgbouncer");
  return {
    connectionString: url.toString(),
    max: Number(process.env.DB_POOL_MAX ?? (local ? 10 : 3)),
    // Supabase's pooler certificate is not in Node's default trust store; traffic is still encrypted.
    ...(local ? {} : { ssl: { rejectUnauthorized: false } }),
  };
}

function create() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set. Run `npm run setup:env`.");
  return new PrismaClient({ adapter: new PrismaPg(poolConfig(connectionString)) });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? create();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type Db = PrismaClient;
