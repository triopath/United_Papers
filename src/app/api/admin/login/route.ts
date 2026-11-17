import { loginSchema } from "@/lib/validation";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, verifyAdminCredentials } from "@/server/auth";
import { clientIp, isSameOrigin, json, rateLimit, tooMany } from "@/server/http";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const rl = rateLimit(`login:${clientIp(req)}`, 8, 5 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Enter your email and password." }, 400);

  const ok = await verifyAdminCredentials(parsed.data.email, parsed.data.password);
  if (!ok) return json({ error: "Incorrect email or password." }, 401);

  const token = await createSessionToken(parsed.data.email);
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(proto === "https"));
  return res;
}
