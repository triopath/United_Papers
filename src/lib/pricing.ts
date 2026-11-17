/** Pure money helpers. All amounts are integer cents to avoid float drift. */

export const FREE_DELIVERY_THRESHOLD_CENTS = 20_000; // $200.00
export const DELIVERY_FEE_CENTS = 1_500; // $15.00
export const MAX_LINES_PER_ORDER = 50;
export const MAX_CASES_PER_LINE = 500;

export type DeliveryMethod = "DELIVERY" | "PICKUP";

export function toCents(value: string | number | { toString(): string }): number {
  const n = Number(value.toString());
  if (!Number.isFinite(n)) throw new Error("Invalid money value");
  return Math.round(n * 100);
}

export function centsToDecimalString(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function deliveryFeeCents(subtotalCents: number, method: DeliveryMethod): number {
  if (method === "PICKUP") return 0;
  return subtotalCents >= FREE_DELIVERY_THRESHOLD_CENTS ? 0 : DELIVERY_FEE_CENTS;
}

export interface PricedLine {
  unitPriceCents: number;
  quantity: number;
}

export function computeTotals(lines: PricedLine[], method: DeliveryMethod) {
  const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  const feeCents = deliveryFeeCents(subtotalCents, method);
  return { subtotalCents, deliveryFeeCents: feeCents, totalCents: subtotalCents + feeCents };
}

/** Merge duplicate SKUs (case-insensitive) by summing quantities. */
export function mergeCartLines<T extends { sku: string; quantity: number }>(items: T[]) {
  const map = new Map<string, { sku: string; quantity: number }>();
  for (const item of items) {
    const sku = item.sku.trim().toUpperCase();
    const existing = map.get(sku);
    if (existing) existing.quantity += item.quantity;
    else map.set(sku, { sku, quantity: item.quantity });
  }
  return [...map.values()];
}
