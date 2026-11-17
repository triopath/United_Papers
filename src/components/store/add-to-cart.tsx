"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "./quantity-stepper";
import { useCart } from "./cart-provider";

export function AddToCart({ sku, available, size = "default" }: { sku: string; available: number; size?: "default" | "lg" }) {
  const { add, items } = useCart();
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);
  const inCart = items.find((i) => i.sku === sku)?.quantity ?? 0;
  const out = available <= 0;

  if (out) {
    return (
      <Button disabled className="w-full" size={size}>
        Out of stock
      </Button>
    );
  }
  const remaining = Math.max(0, available - inCart);
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, remaining)} />
        <Button
          size={size}
          className="h-11 flex-1 gap-2 bg-navy-700 hover:bg-navy-900"
          disabled={remaining <= 0}
          onClick={() => {
            add(sku, qty);
            setDone(true);
            setTimeout(() => setDone(false), 1800);
          }}
        >
          {done ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
          {remaining <= 0 ? "All available in cart" : done ? "Added" : "Add to cart"}
        </Button>
      </div>
      {inCart > 0 && <p className="text-xs text-slate-600" aria-live="polite">{inCart} case{inCart > 1 ? "s" : ""} in your cart</p>}
    </div>
  );
}
