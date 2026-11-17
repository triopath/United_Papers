import { NextResponse } from "next/server";

type Bucket = number[];
const buckets = new Map<string, Bucket>();

/**
 * Simple in-memory sliding-window limiter. PILOT ONLY: per server instance, so on
 * serverless it is best-effort. Production should use a shared store (e.g. Upstash).
 */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    buckets.set(key, arr);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - arr[0])) / 1000) };
  }
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 5000) for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  return { ok: true, retryAfterSec: 0 };
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

/** Reject cross-site browser mutations (defense in depth on top of SameSite cookies). */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients (tests, curl) — still need auth/validation
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export const tooMany = (retryAfterSec: number) =>
  json({ error: "Too many requests. Please slow down.", code: "RATE_LIMITED" }, 429, {
    "Retry-After": String(retryAfterSec),
  });

export const unauthorized = () => json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
