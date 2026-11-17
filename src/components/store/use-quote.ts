"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "./cart-provider";

export interface QuoteLine {
  sku: string;
  found: boolean;
  quantity: number;
  name?: string;
  packLabel?: string;
  imageKind?: string;
  imageUrl?: string | null;
  slug?: string;
  unitPriceCents?: number;
  available?: number;
  ok?: boolean;
}

export interface Quote {
  lines: QuoteLine[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
}

interface Result {
  key: string;
  quote: Quote | null;
  error: string | null;
}

/** Server-priced cart. Re-fetches when the items change; keeps the last quote visible meanwhile. */
export function useQuote(items: CartItem[], enabled: boolean) {
  const [res, setRes] = useState<Result | null>(null);
  const key = JSON.stringify(items);
  const active = enabled && items.length > 0;

  useEffect(() => {
    if (!active) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch("/api/cart/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
          signal: ctl.signal,
        });
        if (!r.ok) throw new Error(r.status === 429 ? "Too many requests — please wait a moment." : "Couldn't load your cart prices.");
        setRes({ key, quote: await r.json(), error: null });
      } catch (e) {
        if ((e as Error).name !== "AbortError") setRes({ key, quote: null, error: (e as Error).message });
      }
    }, 150);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
    // `key` fully describes `items`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, active]);

  return {
    quote: active ? (res?.quote ?? null) : null,
    error: active ? (res?.error ?? null) : null,
    loading: active && res?.key !== key,
  };
}
