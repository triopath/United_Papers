import { checkoutSchema } from "@/lib/validation";
import { createOrder, OrderError } from "@/server/orders";
import { clientIp, isSameOrigin, json, rateLimit, tooMany } from "@/server/http";

/** Public DEMO order submission. No payment is taken; the order is labelled demo. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const rl = rateLimit(`order:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Please check the highlighted fields.", code: "VALIDATION", issues: parsed.error.flatten() }, 400);

  try {
    const order = await createOrder(parsed.data);
    return json(order, order.replayed ? 200 : 201);
  } catch (err) {
    if (err instanceof OrderError) {
      const status = err.code === "INSUFFICIENT_STOCK" ? 409 : 400;
      return json({ error: err.message, code: err.code, details: err.details }, status);
    }
    console.error("order failed", err instanceof Error ? err.name : "unknown"); // no PII in logs
    return json({ error: "We couldn't place the order. Please try again.", code: "SERVER_ERROR" }, 500);
  }
}
