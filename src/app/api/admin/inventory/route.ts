import { assertAdminReq, UnauthorizedError } from "@/server/auth";
import { listInventory } from "@/server/admin-data";
import { json, unauthorized } from "@/server/http";

export async function GET(req: Request) {
  try {
    await assertAdminReq(req);
  } catch (e) {
    if (e instanceof UnauthorizedError) return unauthorized();
    throw e;
  }
  return json({ inventory: await listInventory() });
}
