import { prisma } from "./db";
import { toCents } from "@/lib/pricing";

export type StockLevel = "in" | "low" | "out";

export interface CatalogVariant {
  sku: string;
  name: string;
  packLabel: string;
  unitsPerCase: number;
  casePriceCents: number;
  unitPriceLabel: string;
  specs: Record<string, string>;
  available: number;
  stock: StockLevel;
}

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  imageKind: string;
  imageUrl: string | null;
  category: { slug: string; name: string };
  variants: CatalogVariant[];
}

function stockLevel(available: number, reorderPoint: number): StockLevel {
  if (available <= 0) return "out";
  return available <= Math.max(reorderPoint, 10) ? "low" : "in";
}

type Row = Awaited<ReturnType<typeof queryProducts>>[number];

function mapProduct(p: Row): CatalogProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    description: p.description,
    imageKind: p.imageKind,
    imageUrl: p.imageUrl,
    category: { slug: p.category.slug, name: p.category.name },
    variants: p.variants.map((v) => {
      const available = v.balance ? Math.max(0, v.balance.onHand - v.balance.reserved) : 0;
      const cents = toCents(v.casePrice);
      return {
        sku: v.sku,
        name: v.name,
        packLabel: v.packLabel,
        unitsPerCase: v.unitsPerCase,
        casePriceCents: cents,
        unitPriceLabel: `$${(cents / 100 / v.unitsPerCase).toFixed(3)} each`,
        specs: (v.specs ?? {}) as Record<string, string>,
        available,
        stock: stockLevel(available, v.reorderPoint),
      };
    }),
  };
}

function queryProducts(where: object) {
  return prisma.product.findMany({
    where: { active: true, ...where },
    include: {
      category: true,
      variants: { where: { active: true }, include: { balance: true }, orderBy: { casePrice: "asc" } },
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });
}

export async function listCategories() {
  const cats = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { active: true } } } } },
  });
  return cats.map((c) => ({ slug: c.slug, name: c.name, description: c.description, count: c._count.products }));
}

export async function listProducts(opts: { category?: string; q?: string } = {}) {
  const q = opts.q?.trim().slice(0, 60);
  const rows = await queryProducts({
    ...(opts.category ? { category: { slug: opts.category } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  });
  return rows.map(mapProduct);
}

export async function getProductBySlug(slug: string) {
  const rows = await queryProducts({ slug });
  return rows[0] ? mapProduct(rows[0]) : null;
}

export async function getFeaturedProducts(limit = 8) {
  const all = await listProducts();
  return all.filter((p) => p.variants.some((v) => v.stock !== "out")).slice(0, limit);
}

export async function getOrderConfirmation(orderId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;
  const o = await prisma.salesOrder.findUnique({
    where: { id: orderId },
    include: { lines: true, customer: true },
  });
  if (!o) return null;
  return {
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    deliveryMethod: o.deliveryMethod,
    company: o.customer.companyName,
    city: `${o.customer.city}, ${o.customer.state} ${o.customer.zip}`,
    subtotalCents: toCents(o.subtotal),
    deliveryFeeCents: toCents(o.deliveryFee),
    totalCents: toCents(o.total),
    lines: o.lines.map((l) => ({
      sku: l.sku,
      name: l.productName,
      packLabel: l.packLabel,
      quantity: l.quantity,
      unitPriceCents: toCents(l.unitPrice),
      lineTotalCents: toCents(l.lineTotal),
    })),
  };
}
