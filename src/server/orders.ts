import { Prisma } from "@/generated/prisma/client";
import { prisma, type Db } from "./db";
import {
  centsToDecimalString,
  computeTotals,
  mergeCartLines,
  toCents,
  type DeliveryMethod,
} from "@/lib/pricing";
import type { CheckoutInput } from "@/lib/validation";

export type OrderErrorCode = "UNKNOWN_SKU" | "INSUFFICIENT_STOCK" | "INVALID_ORDER";

export class OrderError extends Error {
  constructor(
    public code: OrderErrorCode,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "OrderError";
  }
}

export interface PlacedOrder {
  orderId: string;
  orderNumber: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  replayed: boolean;
}

function isUniqueViolation(err: unknown, field?: string): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return true;
  const msg = err instanceof Error ? err.message : "";
  return /unique constraint|duplicate key/i.test(msg) && (!field || msg.includes(field));
}

async function loadByKey(db: Db, key: string): Promise<PlacedOrder | null> {
  const o = await db.salesOrder.findUnique({ where: { idempotencyKey: key } });
  if (!o) return null;
  return {
    orderId: o.id,
    orderNumber: o.orderNumber,
    subtotalCents: toCents(o.subtotal),
    deliveryFeeCents: toCents(o.deliveryFee),
    totalCents: toCents(o.total),
    replayed: true,
  };
}

/**
 * Create a sales order and atomically reserve stock.
 *
 * Guarantees:
 *  - Prices/costs/names come from the DB, never from the client.
 *  - Reservation is a single conditional UPDATE per SKU
 *    (onHand - reserved >= qty); concurrent buyers serialize on the row lock
 *    and the loser gets INSUFFICIENT_STOCK. A DB CHECK constraint is the backstop.
 *  - Everything happens in ONE transaction: any failure rolls back all of it.
 *  - Retries with the same idempotency key return the original order and never
 *    reserve twice (unique index on idempotencyKey).
 */
export async function createOrder(input: CheckoutInput, db: Db = prisma): Promise<PlacedOrder> {
  const existing = await loadByKey(db, input.idempotencyKey);
  if (existing) return existing;

  const merged = mergeCartLines(input.items);
  if (merged.length === 0) throw new OrderError("INVALID_ORDER", "Cart is empty");

  // One retry covers the benign race where two first-time buyers with the same
  // email create the customer row simultaneously (unique violation, no side effects left).
  for (let attempt = 1; ; attempt++) {
    try {
      return await placeOnce(input, merged, db);
    } catch (err) {
      if (isUniqueViolation(err)) {
        const winner = await loadByKey(db, input.idempotencyKey);
        if (winner) return winner;
        if (attempt < 2) continue;
      }
      throw err;
    }
  }
}

async function placeOnce(
  input: CheckoutInput,
  merged: { sku: string; quantity: number }[],
  db: Db,
): Promise<PlacedOrder> {
  {
    return await db.$transaction(
      async (tx) => {
        const variants = await tx.productVariant.findMany({
          where: { sku: { in: merged.map((m) => m.sku) }, active: true, product: { active: true } },
          include: { product: true },
        });
        const bySku = new Map(variants.map((v) => [v.sku, v]));
        const unknown = merged.filter((m) => !bySku.has(m.sku)).map((m) => m.sku);
        if (unknown.length) throw new OrderError("UNKNOWN_SKU", `Unknown or inactive SKU: ${unknown.join(", ")}`, { skus: unknown });

        // Lock order is deterministic (by variant id) to avoid deadlocks between buyers.
        const lines = merged
          .map((m) => {
            const v = bySku.get(m.sku)!;
            return { v, quantity: m.quantity, unitPriceCents: toCents(v.casePrice) };
          })
          .sort((a, b) => (a.v.id < b.v.id ? -1 : 1));

        const totals = computeTotals(lines, input.deliveryMethod as DeliveryMethod);

        const customer = await tx.customer.upsert({
          where: { email: input.customer.email },
          update: {
            companyName: input.customer.companyName,
            contactName: input.customer.contactName,
            phone: input.customer.phone,
            addressLine: input.customer.addressLine,
            city: input.customer.city,
            state: input.customer.state,
            zip: input.customer.zip,
          },
          create: { ...input.customer, isDemo: true },
        });

        const seq = await tx.$queryRaw<{ n: bigint }[]>`SELECT nextval('order_number_seq') AS n`;
        const orderNumber = `UP-${seq[0].n.toString()}`;

        const order = await tx.salesOrder.create({
          data: {
            orderNumber,
            customerId: customer.id,
            idempotencyKey: input.idempotencyKey,
            deliveryMethod: input.deliveryMethod,
            notes: input.notes || null,
            subtotal: centsToDecimalString(totals.subtotalCents),
            deliveryFee: centsToDecimalString(totals.deliveryFeeCents),
            total: centsToDecimalString(totals.totalCents),
            isDemo: true,
            lines: {
              create: lines.map((l) => ({
                variantId: l.v.id,
                sku: l.v.sku,
                productName: l.v.product.name,
                packLabel: l.v.packLabel,
                quantity: l.quantity,
                unitPrice: centsToDecimalString(l.unitPriceCents),
                // Snapshot of COST PER CASE at time of sale (variant.unitCost is per piece).
                unitCost: (Number(l.v.unitCost.toString()) * l.v.unitsPerCase).toFixed(4),
                lineTotal: centsToDecimalString(l.unitPriceCents * l.quantity),
              })),
            },
          },
          include: { lines: true },
        });

        for (const line of order.lines) {
          // Atomic check-and-reserve. 0 rows updated => not enough available stock.
          const updated = await tx.$executeRaw`
            UPDATE inventory_balances
               SET reserved = reserved + ${line.quantity}, "updatedAt" = now()
             WHERE "variantId" = ${line.variantId}::uuid
               AND "onHand" - reserved >= ${line.quantity}`;
          if (updated === 0) {
            const bal = await tx.inventoryBalance.findUnique({ where: { variantId: line.variantId } });
            const available = bal ? Math.max(0, bal.onHand - bal.reserved) : 0;
            throw new OrderError("INSUFFICIENT_STOCK", `Only ${available} case(s) of ${line.sku} available`, {
              sku: line.sku,
              requested: line.quantity,
              available,
            });
          }
          await tx.inventoryReservation.create({
            data: { orderLineId: line.id, variantId: line.variantId, quantity: line.quantity },
          });
          await tx.inventoryMovement.create({
            data: {
              variantId: line.variantId,
              type: "RESERVE",
              quantity: line.quantity,
              refType: "SALES_ORDER",
              refId: order.id,
              note: `Reserved for ${orderNumber}`,
            },
          });
        }

        return {
          orderId: order.id,
          orderNumber,
          subtotalCents: totals.subtotalCents,
          deliveryFeeCents: totals.deliveryFeeCents,
          totalCents: totals.totalCents,
          replayed: false,
        };
      },
      { timeout: 20_000, maxWait: 10_000 },
    );
  }
}

/** Server-priced cart preview (read-only). Browser prices are never trusted. */
export async function quoteCart(items: { sku: string; quantity: number }[], method: DeliveryMethod = "DELIVERY", db: Db = prisma) {
  const merged = mergeCartLines(items);
  const variants = await db.productVariant.findMany({
    where: { sku: { in: merged.map((m) => m.sku) }, active: true, product: { active: true } },
    include: { product: true, balance: true },
  });
  const bySku = new Map(variants.map((v) => [v.sku, v]));
  const lines = merged.map((m) => {
    const v = bySku.get(m.sku);
    if (!v) return { sku: m.sku, found: false as const, quantity: m.quantity };
    const available = v.balance ? Math.max(0, v.balance.onHand - v.balance.reserved) : 0;
    return {
      sku: v.sku,
      found: true as const,
      name: v.product.name,
      packLabel: v.packLabel,
      imageKind: v.product.imageKind,
      imageUrl: v.product.imageUrl,
      slug: v.product.slug,
      quantity: m.quantity,
      unitPriceCents: toCents(v.casePrice),
      available,
      ok: available >= m.quantity,
    };
  });
  const priced = lines.filter((l) => l.found) as Extract<(typeof lines)[number], { found: true }>[];
  const totals = computeTotals(priced, method);
  return { lines, ...totals };
}
