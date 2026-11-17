import { listProducts } from "@/server/catalog";
import { json } from "@/server/http";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  if (category && !/^[a-z0-9-]{1,60}$/.test(category)) return json({ error: "Invalid category" }, 400);
  const products = await listProducts({ category, q });
  return json({ products });
}
