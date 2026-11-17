import { assertAdminReq, UnauthorizedError } from "@/server/auth";
import { getOrder } from "@/server/admin-data";
import { json, unauthorized } from "@/server/http";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await assertAdminReq(req);
  } catch (e) {
    if (e instanceof UnauthorizedError) return unauthorized();
    throw e;
  }
  const { id } = await ctx.params;
  const order = await getOrder(id);
  if (!order) return json({ error: "Not found" }, 404);
  return json({ order });
}
