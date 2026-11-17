"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { MAX_CASES_PER_LINE } from "@/lib/pricing";

export interface CartItem {
  sku: string;
  quantity: number;
}

interface CartCtx {
  items: CartItem[];
  count: number;
  ready: boolean;
  add: (sku: string, quantity: number) => void;
  setQuantity: (sku: string, quantity: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
}

const KEY = "up-cart-v1";
const EMPTY: CartItem[] = [];

function clamp(q: number) {
  return Math.max(1, Math.min(MAX_CASES_PER_LINE, Math.floor(q) || 1));
}

function load(): CartItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return EMPTY;
    return raw
      .filter((i) => i && typeof i.sku === "string" && Number.isFinite(i.quantity))
      .map((i) => ({ sku: String(i.sku).toUpperCase(), quantity: clamp(i.quantity) }));
  } catch {
    return EMPTY;
  }
}

// Tiny external store backed by localStorage (also syncs across tabs).
let cache: CartItem[] | null = null;
const listeners = new Set<() => void>();

const getSnapshot = () => (cache ??= load());
const getServerSnapshot = () => EMPTY;

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function write(next: CartItem[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode: cart still works for this tab */
  }
  listeners.forEach((l) => l());
}

const noopSubscribe = () => () => {};
const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // false during server render / hydration, true afterwards (no effect needed)
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      ready,
      count: items.reduce((s, i) => s + i.quantity, 0),
      add: (sku, quantity) => {
        const s = sku.toUpperCase();
        const cur = getSnapshot();
        const existing = cur.find((i) => i.sku === s);
        write(existing ? cur.map((i) => (i.sku === s ? { ...i, quantity: clamp(i.quantity + quantity) } : i)) : [...cur, { sku: s, quantity: clamp(quantity) }]);
      },
      setQuantity: (sku, quantity) => write(getSnapshot().map((i) => (i.sku === sku ? { ...i, quantity: clamp(quantity) } : i))),
      remove: (sku) => write(getSnapshot().filter((i) => i.sku !== sku)),
      clear: () => write([]),
    }),
    [items, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
}
