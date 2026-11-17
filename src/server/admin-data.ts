import "server-only";
import { prisma } from "./db";
import { toCents } from "@/lib/pricing";

/** NOTE: callers (pages / route handlers) MUST authenticate before calling these. */

export async function getDashboard() {
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [orders, balances, recent, agg, todayAgg] = await Promise.all([
    prisma.salesOrder.count(),
    prisma.inventoryBalance.findMany({ include: { variant: { include: { product: true } } } }),
    prisma.salesOrder.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { customer: true, lines: true } }),
    prisma.salesOrder.aggregate({ _sum: { total: true }, where: { status: { not: "CANCELLED" } } }),
    prisma.salesOrder.aggregate({ _sum: { total: true }, _count: true, where: { createdAt: { gte: startOfToday }, status: { not: "CANCELLED" } } }),
  ]);
  const weekOrders = await prisma.salesOrder.findMany({
    where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
    select: { createdAt: true, total: true },
  });

  let stockValueCents = 0;
  let reservedCases = 0;
  let onHandCases = 0;
  const low: { sku: string; name: string; available: number; onHand: number; reserved: number; reorderPoint: number }[] = [];
  let outCount = 0;
  for (const b of balances) {
    const available = b.onHand - b.reserved;
    stockValueCents += Math.round(Number(b.variant.unitCost.toString()) * b.variant.unitsPerCase * b.onHand * 100);
    reservedCases += b.reserved;
    onHandCases += b.onHand;
    if (available <= 0) outCount++;
    if (available <= b.variant.reorderPoint) {
      low.push({
        sku: b.variant.sku,
        name: b.variant.product.name,
        available,
        onHand: b.onHand,
        reserved: b.reserved,
        reorderPoint: b.variant.reorderPoint,
      });
    }
  }
  low.sort((a, b) => a.available - b.available);

  const days: { label: string; totalCents: number; orders: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({ label: d.toLocaleDateString("en-US", { weekday: "short" }), totalCents: 0, orders: 0 });
  }
  for (const o of weekOrders) {
    const diff = Math.floor((startOfToday.getTime() - new Date(new Date(o.createdAt).setHours(0, 0, 0, 0)).getTime()) / 86400000);
    const idx = 6 - diff;
    if (idx >= 0 && idx < 7) {
      days[idx].totalCents += toCents(o.total);
      days[idx].orders += 1;
    }
  }

  return {
    totalOrders: orders,
    revenueCents: toCents(agg._sum.total ?? 0),
    ordersToday: todayAgg._count,
    revenueTodayCents: toCents(todayAgg._sum.total ?? 0),
    skuCount: balances.length,
    onHandCases,
    reservedCases,
    stockValueCents,
    lowStock: low,
    outOfStockCount: outCount,
    days,
    recent: recent.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      company: o.customer.companyName,
      status: o.status,
      totalCents: toCents(o.total),
      lineCount: o.lines.length,
      createdAt: o.createdAt,
    })),
  };
}

export async function listOrders(opts: { status?: string; q?: string } = {}) {
  const q = opts.q?.trim().slice(0, 60);
  const rows = await prisma.salesOrder.findMany({
    where: {
      ...(opts.status ? { status: opts.status as never } : {}),
      ...(q
        ? { OR: [{ orderNumber: { contains: q, mode: "insensitive" } }, { customer: { companyName: { contains: q, mode: "insensitive" } } }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { customer: true, lines: true },
  });
  return rows.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    company: o.customer.companyName,
    status: o.status,
    deliveryMethod: o.deliveryMethod,
    lineCount: o.lines.length,
    cases: o.lines.reduce((s, l) => s + l.quantity, 0),
    totalCents: toCents(o.total),
    createdAt: o.createdAt,
  }));
}

export async function getOrder(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const o = await prisma.salesOrder.findUnique({
    where: { id },
    include: { customer: true, lines: { orderBy: { sku: "asc" }, include: { reservation: true } } },
  });
  if (!o) return null;
  const cost = o.lines.reduce((s, l) => s + Math.round(Number(l.unitCost.toString()) * 100 * l.quantity), 0);
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    isDemo: o.isDemo,
    deliveryMethod: o.deliveryMethod,
    notes: o.notes,
    createdAt: o.createdAt,
    customer: o.customer,
    subtotalCents: toCents(o.subtotal),
    deliveryFeeCents: toCents(o.deliveryFee),
    totalCents: toCents(o.total),
    lines: o.lines.map((l) => ({
      id: l.id,
      sku: l.sku,
      name: l.productName,
      packLabel: l.packLabel,
      quantity: l.quantity,
      unitPriceCents: toCents(l.unitPrice),
      lineTotalCents: toCents(l.lineTotal),
      reservation: l.reservation?.status ?? null,
    })),
    costCents: cost,
    grossMarginCents: o.lines.reduce((s, l) => s + toCents(l.lineTotal), 0) - cost,
  };
}

export async function listInventory() {
  const rows = await prisma.inventoryBalance.findMany({
    include: { variant: { include: { product: { include: { category: true } }, supplier: true } } },
    orderBy: { variant: { sku: "asc" } },
  });
  return rows.map((b) => {
    const available = b.onHand - b.reserved;
    return {
      sku: b.variant.sku,
      product: b.variant.product.name,
      category: b.variant.product.category.name,
      packLabel: b.variant.packLabel,
      supplier: b.variant.supplier?.name ?? "—",
      onHand: b.onHand,
      reserved: b.reserved,
      available,
      reorderPoint: b.variant.reorderPoint,
      status: available <= 0 ? "out" : available <= b.variant.reorderPoint ? "low" : "ok",
      valueCents: Math.round(Number(b.variant.unitCost.toString()) * b.variant.unitsPerCase * b.onHand * 100),
    };
  });
}

export async function listMovements(sku: string, take = 15) {
  return prisma.inventoryMovement.findMany({
    where: { variant: { sku } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function listAdminProducts() {
  const rows = await prisma.productVariant.findMany({
    include: { product: { include: { category: true } }, balance: true },
    orderBy: [{ product: { category: { sortOrder: "asc" } } }, { sku: "asc" }],
  });
  return rows.map((v) => {
    const price = toCents(v.casePrice);
    const cost = Math.round(Number(v.unitCost.toString()) * v.unitsPerCase * 100);
    return {
      sku: v.sku,
      name: v.product.name,
      category: v.product.category.name,
      packLabel: v.packLabel,
      priceCents: price,
      costCents: cost,
      marginPct: price > 0 ? Math.round(((price - cost) / price) * 1000) / 10 : 0,
      available: v.balance ? v.balance.onHand - v.balance.reserved : 0,
      active: v.active,
    };
  });
}

export async function listCustomers() {
  const rows = await prisma.customer.findMany({ include: { orders: true }, orderBy: { createdAt: "desc" } });
  return rows.map((c) => ({
    id: c.id,
    companyName: c.companyName,
    contactName: c.contactName,
    email: c.email,
    city: `${c.city}, ${c.state}`,
    orders: c.orders.length,
    spentCents: c.orders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + toCents(o.total), 0),
  }));
}

export async function listSuppliers() {
  const rows = await prisma.supplier.findMany({ include: { _count: { select: { variants: true } } }, orderBy: { name: "asc" } });
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    contactName: s.contactName,
    email: s.email,
    leadTimeDays: s.leadTimeDays,
    minOrderCases: s.minOrderCases,
    skuCount: s._count.variants,
  }));
}
