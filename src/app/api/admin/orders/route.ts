import { assertAdminReq, UnauthorizedError } from "@/server/auth";
import { listOrders } from "@/server/admin-data";
import { json, unauthorized } from "@/server/http";

export async function GET(req: Request) {
  try {
    await assertAdminReq(req);
  } catch (e) {
    if (e instanceof UnauthorizedError) return unauthorized();
    throw e;
  }
  const url = new URL(req.url);
  const orders = await listOrders({
    status: url.searchParams.get("status") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });
  return json({ orders });
}
