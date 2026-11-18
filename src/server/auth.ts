import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";
import { verifyPassword } from "./password";

export const SESSION_COOKIE = "up_admin_session";
const SESSION_HOURS = 8;
/** Roles allowed into the back-office portal. STAFF is reserved for later. */
const PORTAL_ROLES = ["OWNER", "ADMIN"] as const;
type PortalRole = (typeof PORTAL_ROLES)[number];

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

function secretKey(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET missing or too short (needs 32+ characters).");
  return new TextEncoder().encode(s);
}

export const isPortalRole = (r: unknown): r is PortalRole => PORTAL_ROLES.includes(r as PortalRole);

/**
 * Standard credential check against the admin_users table.
 * Returns the user on success, otherwise null (same result for every failure reason).
 */
export async function verifyAdminCredentials(email: string, password: string) {
  const user = await prisma.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  const passwordOk = await verifyPassword(password, user?.passwordHash);
  if (!user || !passwordOk || !user.active || !isPortalRole(user.role)) return null;
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});
  return { email: user.email, role: user.role as PortalRole };
}

export async function createSessionToken(email: string, role: PortalRole): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secretKey());
}

export const sessionCookieOptions = (secure: boolean) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure,
  path: "/",
  maxAge: SESSION_HOURS * 3600,
});

export async function readSession(token: string | undefined): Promise<{ email: string; role: PortalRole } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (!isPortalRole(payload.role) || !payload.sub) return null;
    return { email: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}

/** For API route handlers: authenticate from the raw Cookie header. */
export async function assertAdminReq(req: Request) {
  const raw = req.headers.get("cookie") ?? "";
  const match = raw.split(/;\s*/).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  const s = await readSession(match ? decodeURIComponent(match.slice(SESSION_COOKIE.length + 1)) : undefined);
  if (!s) throw new UnauthorizedError();
  return s;
}

/** For server components/actions: throws if not an authenticated admin. */
export async function assertAdmin() {
  const s = await getAdminSession();
  if (!s) throw new UnauthorizedError();
  return s;
}

/** For pages: redirects to login if not authenticated. */
export async function requireAdminPage() {
  const s = await getAdminSession();
  if (!s) redirect("/admin/login");
  return s;
}
