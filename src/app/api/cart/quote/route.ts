import { cartQuoteSchema } from "@/lib/validation";
import { quoteCart } from "@/server/orders";
import { clientIp, isSameOrigin, json, rateLimit, tooMany } from "@/server/http";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const rl = rateLimit(`quote:${clientIp(req)}`, 120, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const body = await req.json().catch(() => null);
  const parsed = cartQuoteSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Invalid cart", issues: parsed.error.flatten() }, 400);

  const quote = await quoteCart(parsed.data.items);
  return json(quote);
}
