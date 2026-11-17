import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/server/db";
import { createOrder } from "../src/server/orders";
import { categories, customers, historicalOrders, products, suppliers } from "./seed-data";

/** Idempotent: safe to re-run. Never resets existing stock or orders. */
async function main() {
  let catOrder = 0;
  const catIds = new Map<string, string>();
  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description },
      create: { ...c, sortOrder: catOrder },
    });
    catIds.set(c.slug, row.id);
    catOrder++;
  }

  const supIds: { key: string; id: string }[] = [];
  for (const s of suppliers) {
    const found = await prisma.supplier.findFirst({ where: { email: s.email } });
    const row = found ?? (await prisma.supplier.create({ data: s }));
    supIds.push({ key: s.name.split(" ")[0], id: row.id });
  }

  let skuCount = 0;
  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: { name: p.name, description: p.description, imageKind: p.kind, imageUrl: p.imageUrl ?? null },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        imageKind: p.kind,
        imageUrl: p.imageUrl ?? null,
        categoryId: catIds.get(p.category)!,
      },
    });
    const supplierId = supIds.find((s) => s.key === p.supplier)?.id ?? null;
    for (const v of p.variants) {
      const variant = await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: { name: v.name, packLabel: v.pack, casePrice: v.price.toFixed(2), specs: v.specs ?? {}, reorderPoint: v.reorder, supplierId },
        create: {
          productId: product.id,
          supplierId,
          sku: v.sku,
          name: v.name,
          packLabel: v.pack,
          unitsPerCase: v.units,
          casePrice: v.price.toFixed(2),
          unitCost: ((v.price / v.units) * p.cost).toFixed(4),
          specs: v.specs ?? {},
          reorderPoint: v.reorder,
        },
      });
      const bal = await prisma.inventoryBalance.findUnique({ where: { variantId: variant.id } });
      if (!bal) {
        await prisma.inventoryBalance.create({ data: { variantId: variant.id, onHand: v.onHand, reserved: 0 } });
        if (v.onHand > 0) {
          await prisma.inventoryMovement.create({
            data: { variantId: variant.id, type: "RECEIPT", quantity: v.onHand, refType: "SEED", note: "Opening stock (demo data)" },
          });
        }
      }
      skuCount++;
    }
  }

  const customerRows = [];
  for (const c of customers) {
    customerRows.push(await prisma.customer.upsert({ where: { email: c.email }, update: {}, create: { ...c, isDemo: true } }));
  }

  const existingOrders = await prisma.salesOrder.count();
  let seeded = 0;
  if (existingOrders === 0) {
    for (const [ci, daysAgo, items] of historicalOrders) {
      const c = customers[ci];
      const placed = await createOrder({
        idempotencyKey: randomUUID(),
        items: items.map(([sku, quantity]) => ({ sku, quantity })),
        deliveryMethod: "DELIVERY",
        customer: { ...c },
        notes: "Seeded demo order",
      });
      const when = new Date(Date.now() - daysAgo * 24 * 3600 * 1000 - Math.floor(Math.random() * 6) * 3600 * 1000);
      await prisma.salesOrder.update({ where: { id: placed.orderId }, data: { createdAt: when } });
      seeded++;
    }
  }

  const [cats, prods, variants, orders, custs] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.salesOrder.count(),
    prisma.customer.count(),
  ]);
  console.log(`Seed complete: ${cats} categories, ${prods} products, ${variants} SKUs, ${custs} customers, ${orders} orders (${seeded} new).`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
