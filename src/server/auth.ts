import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

export const SESSION_COOKIE = "up_admin_session";
const SESSION_HOURS = 8;
// Used to keep response time similar when the email is wrong.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO8hS3F8GgY3p5Zk1yQ9m0g4cJw8m9u2S";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

function secretKey(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET missing or too short. Run `npm run setup:env`.");
  return new TextEncoder().encode(s);
}

function adminHash(): string | null {
  const h = process.env.ADMIN_PASSWORD_HASH;
  if (!h) return null;
  return h.replace(/\\\$/g, "$"); // tolerate dotenv-escaped dollars
}

const sha = (s: string) => createHash("sha256").update(s).digest();

/**
 * Fails closed: if admin credentials are not configured, nobody can log in.
 * Password comes from the environment (never from code):
 *  - ADMIN_PASSWORD       simple option for the demo (set it in Vercel; change it any time + redeploy)
 *  - ADMIN_PASSWORD_HASH  bcrypt hash (preferred for real use). Used only when ADMIN_PASSWORD is unset.
 */
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!expectedEmail) return false;
  const emailOk = email.trim().toLowerCase() === expectedEmail;

  const plain = process.env.ADMIN_PASSWORD;
  if (plain) {
    // Compare fixed-length digests in constant time; never short-circuit on the email.
    const passOk = timingSafeEqual(sha(password), sha(plain));
    return emailOk && passOk;
  }

  const hash = adminHash();
  if (!hash) return false;
  const passOk = await bcrypt.compare(password, emailOk ? hash : DUMMY_HASH);
  return emailOk && passOk;
}

/**
 * Safe diagnostics for SERVER LOGS ONLY (Vercel -> Logs). Contains no secrets or values:
 * just which mode is configured and whether the typed email matched.
 */
export function adminAuthDiagnostics(typedEmail: string) {
  const expected = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return {
    emailConfigured: !!expected,
    emailMatches: !!expected && typedEmail.trim().toLowerCase() === expected,
    mode: process.env.ADMIN_PASSWORD ? "plain" : adminHash() ? "hash" : "none",
    vercelEnv: process.env.VERCEL_ENV ?? "local", // production | preview | development
  };
}

export async function createSessionToken(email: string): Promise<string> {
  return new SignJWT({ role: "admin" })
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

export async function readSession(token: string | undefined): Promise<{ email: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.role !== "admin" || !payload.sub) return null;
    return { email: payload.sub };
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
