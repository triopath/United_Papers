"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./cart-provider";

export function CartButton() {
  const { count, ready } = useCart();
  return (
    <Link href="/cart" className="relative flex h-11 items-center gap-2 rounded-lg bg-navy-50 px-4 text-sm font-semibold text-navy-900 hover:bg-navy-100">
      <ShoppingCart className="size-5" aria-hidden="true" />
      <span>Cart</span>
      <span aria-label={`${ready ? count : 0} cases in cart`} className="grid min-w-6 place-items-center rounded-full bg-navy-700 px-1.5 text-xs font-bold text-white">
        {ready ? count : 0}
      </span>
    </Link>
  );
}
