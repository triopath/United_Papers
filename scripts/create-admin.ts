/**
 * Create (or reset the password of) a back-office user. Passwords are stored only as bcrypt hashes.
 *
 *   npm run admin:create -- <email> <password> [OWNER|ADMIN|STAFF]
 *
 * Uses DATABASE_URL (from .env, or from the environment for a one-off run against another database).
 * Nothing secret is printed.
 */
import "dotenv/config";
import { prisma } from "../src/server/db";
import { hashPassword } from "../src/server/password";

async function main() {
  const [emailArg, password, roleArg = "ADMIN"] = process.argv.slice(2);
  const email = emailArg?.trim().toLowerCase();
  const role = roleArg.toUpperCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Usage: npm run admin:create -- <email> <password> [OWNER|ADMIN|STAFF]  (valid email required)");
  if (!password || password.length < 8) throw new Error("Password must be at least 8 characters.");
  if (!["OWNER", "ADMIN", "STAFF"].includes(role)) throw new Error("Role must be OWNER, ADMIN or STAFF.");

  const passwordHash = await hashPassword(password);
  const user = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, role: role as "OWNER" | "ADMIN" | "STAFF", active: true },
    create: { email, passwordHash, role: role as "OWNER" | "ADMIN" | "STAFF" },
  });
  const host = new URL(process.env.DATABASE_URL!).hostname;
  console.log(`Admin user ready: ${user.email} (role ${user.role}) on database host ${host}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
