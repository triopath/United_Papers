import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db";
import type { CheckoutInput } from "@/lib/validation";

export async function resetDb() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE inventory_reservations, inventory_movements, sales_order_lines, sales_orders, customers,
     inventory_balances, product_variants, products, suppliers, categories RESTART IDENTITY CASCADE`,
  );
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE order_number_seq RESTART WITH 10001`);
}

/** Two SKUs: CUP (price 34.00, 10 on hand) and LID (28.50, 3 on hand). */
export async function seedMini() {
  const cat = await prisma.category.create({ data: { slug: "cups-lids", name: "Cups & Lids" } });
  const mk = async (slug: string, sku: string, price: string, onHand: number) => {
    const p = await prisma.product.create({ data: { slug, name: slug, categoryId: cat.id } });
    const v = await prisma.productVariant.create({
      data: { productId: p.id, sku, name: sku, packLabel: "Case of 1,000", unitsPerCase: 1000, casePrice: price, unitCost: "0.0220", reorderPoint: 2 },
    });
    await prisma.inventoryBalance.create({ data: { variantId: v.id, onHand, reserved: 0 } });
    return v;
  };
  const cup = await mk("cup", "UP-CUP-H16", "34.00", 10);
  const lid = await mk("lid", "UP-LID-H90B", "28.50", 3);
  return { cup, lid };
}

export function checkout(items: { sku: string; quantity: number }[], over: Partial<CheckoutInput> = {}): CheckoutInput {
  return {
    idempotencyKey: randomUUID(),
    items,
    deliveryMethod: "DELIVERY",
    customer: {
      companyName: "Test Bistro",
      contactName: "Tess T.",
      email: "tess@testbistro.example.test",
      phone: "555-0100",
      addressLine: "1 Test St",
      city: "Naperville",
      state: "IL",
      zip: "60540",
    },
    ...over,
  };
}

export async function stock(sku: string) {
  const b = await prisma.inventoryBalance.findFirstOrThrow({ where: { variant: { sku } } });
  return { onHand: b.onHand, reserved: b.reserved, available: b.onHand - b.reserved };
}
