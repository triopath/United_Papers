import { describe, expect, it } from "vitest";
import { centsToDecimalString, computeTotals, deliveryFeeCents, mergeCartLines, toCents } from "@/lib/pricing";
import { checkoutSchema } from "@/lib/validation";

describe("pricing", () => {
  it("converts money without float drift", () => {
    expect(toCents("34.00")).toBe(3400);
    expect(toCents("0.1") + toCents("0.2")).toBe(30);
    expect(centsToDecimalString(1905)).toBe("19.05");
  });

  it("charges delivery under $200, free at or above, free for pickup", () => {
    expect(deliveryFeeCents(19_999, "DELIVERY")).toBe(1500);
    expect(deliveryFeeCents(20_000, "DELIVERY")).toBe(0);
    expect(deliveryFeeCents(5_000, "PICKUP")).toBe(0);
  });

  it("computes totals from unit price × quantity", () => {
    const t = computeTotals([{ unitPriceCents: 3400, quantity: 2 }, { unitPriceCents: 2850, quantity: 1 }], "DELIVERY");
    expect(t).toEqual({ subtotalCents: 9650, deliveryFeeCents: 1500, totalCents: 11150 });
  });

  it("merges duplicate SKUs case-insensitively", () => {
    expect(mergeCartLines([{ sku: "up-cup-h16", quantity: 1 }, { sku: "UP-CUP-H16", quantity: 2 }])).toEqual([
      { sku: "UP-CUP-H16", quantity: 3 },
    ]);
  });
});

describe("checkout validation", () => {
  const base = {
    idempotencyKey: "6f1c2d9e-3b4a-4c5d-8e7f-0a1b2c3d4e5f",
    deliveryMethod: "DELIVERY",
    customer: { companyName: "A", contactName: "B", email: "a@b.co", phone: "1", addressLine: "x", city: "y", state: "il", zip: "60540" },
  };
  it("rejects zero, negative, fractional and huge quantities", () => {
    for (const quantity of [0, -1, 1.5, 100000]) {
      expect(checkoutSchema.safeParse({ ...base, items: [{ sku: "UP-CUP-H16", quantity }] }).success).toBe(false);
    }
  });
  it("rejects empty carts and malformed SKUs", () => {
    expect(checkoutSchema.safeParse({ ...base, items: [] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...base, items: [{ sku: "x'; DROP TABLE", quantity: 1 }] }).success).toBe(false);
  });
  it("normalizes state and accepts a valid order", () => {
    const r = checkoutSchema.safeParse({ ...base, items: [{ sku: "UP-CUP-H16", quantity: 2 }] });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.customer.state).toBe("IL");
  });
});
