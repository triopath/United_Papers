import { beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { createOrder, OrderError, quoteCart } from "@/server/orders";
import { listProducts } from "@/server/catalog";
import { getDashboard, getOrder, listInventory, listOrders } from "@/server/admin-data";
import { checkout, resetDb, seedMini, stock } from "./helpers";

beforeEach(async () => {
  await resetDb();
  await seedMini();
});

describe("catalog", () => {
  it("lists products loaded from the database with case price and availability", async () => {
    const products = await listProducts();
    expect(products.map((p) => p.slug).sort()).toEqual(["cup", "lid"]);
    const cup = products.find((p) => p.slug === "cup")!.variants[0];
    expect(cup.casePriceCents).toBe(3400);
    expect(cup.available).toBe(10);
  });
});

describe("order creation", () => {
  it("creates an order, prices it server-side and reserves stock", async () => {
    const placed = await createOrder(checkout([{ sku: "UP-CUP-H16", quantity: 2 }, { sku: "UP-LID-H90B", quantity: 1 }]));
    expect(placed.orderNumber).toBe("UP-10001");
    expect(placed.subtotalCents).toBe(2 * 3400 + 2850);
    expect(placed.deliveryFeeCents).toBe(1500); // under $200
    expect(placed.totalCents).toBe(9650 + 1500);
    expect(await stock("UP-CUP-H16")).toEqual({ onHand: 10, reserved: 2, available: 8 });
    expect(await stock("UP-LID-H90B")).toEqual({ onHand: 3, reserved: 1, available: 2 });
  });

  it("stores line snapshots, reservations and ledger movements", async () => {
    const placed = await createOrder(checkout([{ sku: "UP-CUP-H16", quantity: 3 }]));
    const order = await prisma.salesOrder.findUniqueOrThrow({ where: { id: placed.orderId }, include: { lines: { include: { reservation: true } } } });
    expect(order.isDemo).toBe(true);
    expect(order.lines[0].unitPrice.toString()).toBe("34");
    expect(order.lines[0].lineTotal.toString()).toBe("102");
    expect(order.lines[0].reservation?.quantity).toBe(3);
    expect(order.lines[0].reservation?.status).toBe("ACTIVE");
    // price change after the sale must not change history
    await prisma.productVariant.update({ where: { sku: "UP-CUP-H16" }, data: { casePrice: "99.00" } });
    const again = await prisma.salesOrderLine.findFirstOrThrow({ where: { orderId: placed.orderId } });
    expect(again.unitPrice.toString()).toBe("34");
    const moves = await prisma.inventoryMovement.findMany({ where: { refId: placed.orderId } });
    expect(moves).toHaveLength(1);
    expect(moves[0].type).toBe("RESERVE");
  });

  it("ignores any browser-supplied price or total", async () => {
    const input = { ...checkout([{ sku: "UP-CUP-H16", quantity: 1 }]) } as Record<string, unknown>;
    (input.items as Record<string, unknown>[])[0].unitPrice = 0.01;
    input.total = 1;
    const placed = await createOrder(input as never);
    expect(placed.subtotalCents).toBe(3400);
  });

  it("free delivery at $200+ and for pickup", async () => {
    const big = await createOrder(checkout([{ sku: "UP-CUP-H16", quantity: 6 }])); // $204
    expect(big.deliveryFeeCents).toBe(0);
    const pick = await createOrder(checkout([{ sku: "UP-LID-H90B", quantity: 1 }], { deliveryMethod: "PICKUP" }));
    expect(pick.deliveryFeeCents).toBe(0);
  });

  it("rejects unknown SKUs", async () => {
    await expect(createOrder(checkout([{ sku: "NOPE-1", quantity: 1 }]))).rejects.toMatchObject({ code: "UNKNOWN_SKU" });
  });
});

describe("inventory protection", () => {
  it("rejects insufficient stock and leaves NO partial state behind", async () => {
    // First line is fine, second line exceeds stock => whole order must roll back.
    const p = createOrder(checkout([{ sku: "UP-CUP-H16", quantity: 2 }, { sku: "UP-LID-H90B", quantity: 4 }]));
    await expect(p).rejects.toBeInstanceOf(OrderError);
    await expect(p).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });
    expect(await prisma.salesOrder.count()).toBe(0);
    expect(await prisma.inventoryReservation.count()).toBe(0);
    expect(await prisma.inventoryMovement.count()).toBe(0);
    expect(await stock("UP-CUP-H16")).toEqual({ onHand: 10, reserved: 0, available: 10 });
    expect(await stock("UP-LID-H90B")).toEqual({ onHand: 3, reserved: 0, available: 3 });
  });

  it("can buy exactly the remaining stock, then nothing more", async () => {
    await createOrder(checkout([{ sku: "UP-LID-H90B", quantity: 3 }]));
    await expect(createOrder(checkout([{ sku: "UP-LID-H90B", quantity: 1 }]))).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });
    expect((await stock("UP-LID-H90B")).available).toBe(0);
  });

  it("database CHECK constraint blocks over-reservation even via raw SQL", async () => {
    await expect(
      prisma.$executeRawUnsafe(`UPDATE inventory_balances SET reserved = onHand + 1 WHERE true`),
    ).rejects.toThrow();
  });

  it("duplicate submission with the same idempotency key does not reserve twice", async () => {
    const input = checkout([{ sku: "UP-CUP-H16", quantity: 2 }]);
    const a = await createOrder(input);
    const b = await createOrder(input);
    expect(b.orderId).toBe(a.orderId);
    expect(b.replayed).toBe(true);
    expect(await prisma.salesOrder.count()).toBe(1);
    expect((await stock("UP-CUP-H16")).reserved).toBe(2);
  });

  it("concurrent duplicate submissions (double-click) create one order", async () => {
    const input = checkout([{ sku: "UP-CUP-H16", quantity: 2 }]);
    const results = await Promise.all([createOrder(input), createOrder(input), createOrder(input)]);
    expect(new Set(results.map((r) => r.orderId)).size).toBe(1);
    expect(await prisma.salesOrder.count()).toBe(1);
    expect((await stock("UP-CUP-H16")).reserved).toBe(2);
  });

  it("two concurrent buyers cannot oversell the last cases", async () => {
    // 3 lids available; two buyers each want 2. Exactly one may win.
    const [a, b] = await Promise.allSettled([
      createOrder(checkout([{ sku: "UP-LID-H90B", quantity: 2 }], { customer: { ...checkout([]).customer, email: "a@x.example.test" } })),
      createOrder(checkout([{ sku: "UP-LID-H90B", quantity: 2 }], { customer: { ...checkout([]).customer, email: "b@x.example.test" } })),
    ]);
    const outcomes = [a, b].map((r) => r.status);
    expect(outcomes.filter((o) => o === "fulfilled")).toHaveLength(1);
    const loser = [a, b].find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(loser.reason).toMatchObject({ code: "INSUFFICIENT_STOCK" });
    expect(await stock("UP-LID-H90B")).toEqual({ onHand: 3, reserved: 2, available: 1 });
    expect(await prisma.salesOrder.count()).toBe(1);
  });

  it("20 simultaneous buyers (same new email) never oversell 10 cases", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () => createOrder(checkout([{ sku: "UP-CUP-H16", quantity: 1 }]))),
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const unexpected = results.filter((r) => r.status === "rejected" && (r.reason as OrderError).code !== "INSUFFICIENT_STOCK");
    // Show WHY on failure (name + first line of the message) rather than just a count.
    expect(unexpected.map((r) => String((r as PromiseRejectedResult).reason?.message ?? r).split("\n").filter(Boolean).slice(-2).join(" | ").slice(0, 220))).toEqual([]);
    expect(ok).toBe(10);
    expect(await stock("UP-CUP-H16")).toEqual({ onHand: 10, reserved: 10, available: 0 });
    const orderNumbers = (await prisma.salesOrder.findMany()).map((o) => o.orderNumber);
    expect(new Set(orderNumbers).size).toBe(orderNumbers.length);
  });
});

describe("cart quote", () => {
  it("returns server prices and flags insufficient availability", async () => {
    const q = await quoteCart([{ sku: "UP-LID-H90B", quantity: 5 }, { sku: "up-cup-h16", quantity: 1 }, { sku: "GHOST", quantity: 1 }]);
    const lid = q.lines.find((l) => l.sku === "UP-LID-H90B")!;
    expect(lid.found && lid.ok).toBe(false);
    expect(q.lines.find((l) => l.sku === "GHOST")!.found).toBe(false);
    expect(q.subtotalCents).toBe(5 * 2850 + 3400);
  });
});

describe("admin view of persisted data", () => {
  it("shows the order, its lines, reduced availability and dashboard metrics", async () => {
    const placed = await createOrder(checkout([{ sku: "UP-CUP-H16", quantity: 4 }]));
    const orders = await listOrders();
    expect(orders[0]).toMatchObject({ orderNumber: placed.orderNumber, cases: 4, company: "Test Bistro" });

    const detail = await getOrder(placed.orderId);
    expect(detail?.lines[0]).toMatchObject({ sku: "UP-CUP-H16", quantity: 4, unitPriceCents: 3400, reservation: "ACTIVE" });
    expect(detail?.grossMarginCents).toBeGreaterThan(0);

    const inv = (await listInventory()).find((i) => i.sku === "UP-CUP-H16")!;
    expect(inv).toMatchObject({ onHand: 10, reserved: 4, available: 6 });

    const dash = await getDashboard();
    expect(dash.totalOrders).toBe(1);
    expect(dash.revenueCents).toBe(4 * 3400 + 1500);
    expect(dash.reservedCases).toBe(4);
  });

  it("a fresh database client (simulating an app restart) still sees committed orders", async () => {
    const placed = await createOrder(checkout([{ sku: "UP-CUP-H16", quantity: 1 }]));
    const fresh = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
    const found = await fresh.salesOrder.findUnique({ where: { id: placed.orderId } });
    await fresh.$disconnect();
    expect(found?.orderNumber).toBe(placed.orderNumber);
  });

  it("rejects malformed order ids without querying", async () => {
    expect(await getOrder("not-a-uuid")).toBeNull();
    expect(await getOrder(randomUUID())).toBeNull();
  });
});
