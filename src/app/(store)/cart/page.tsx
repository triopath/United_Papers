"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, ShoppingCart, Trash2 } from "lucide-react";
import { ProductArt } from "@/components/brand/product-art";
import { useCart } from "@/components/store/cart-provider";
import { QuantityStepper } from "@/components/store/quantity-stepper";
import { useQuote } from "@/components/store/use-quote";
import { FREE_DELIVERY_THRESHOLD_CENTS, formatUsd } from "@/lib/pricing";

export default function CartPage() {
  const { items, ready, setQuantity, remove } = useCart();
  const { quote, error, loading } = useQuote(items, ready);

  if (!ready) return <Shell><p className="py-20 text-center text-slate-600">Loading your cart…</p></Shell>;

  if (items.length === 0) {
    return (
      <Shell>
        <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
          <ShoppingCart className="mb-3 size-10 text-slate-400" aria-hidden="true" />
          <h2 className="font-heading text-xl font-bold text-navy-900">Your cart is empty</h2>
          <p className="mt-1 text-slate-600">Add a few cases to get started.</p>
          <Link href="/products" className="mt-5 inline-flex h-11 items-center rounded-lg bg-navy-700 px-5 font-semibold text-white hover:bg-navy-900">Browse the catalog</Link>
        </div>
      </Shell>
    );
  }

  const lines = quote?.lines ?? [];
  const problems = lines.filter((l) => !l.found || l.ok === false);
  const remaining = quote ? Math.max(0, FREE_DELIVERY_THRESHOLD_CENTS - quote.subtotalCents) : 0;

  return (
    <Shell>
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {problems.length > 0 && (
        <div role="alert" className="mb-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Some items need your attention before checkout.</p>
            <ul className="mt-1 list-disc pl-5">
              {problems.map((l) => (
                <li key={l.sku}>{l.found ? `${l.name}: only ${l.available} case(s) available (you have ${l.quantity}).` : `${l.sku} is no longer available.`}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-3" aria-label="Cart items">
          {items.map((it) => {
            const l = lines.find((x) => x.sku === it.sku);
            return (
              <li key={it.sku} className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                <ProductArt kind={l?.imageKind ?? "generic"} imageUrl={l?.imageUrl} alt={l?.name ?? it.sku} className="size-20 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 basis-48">
                  {l?.slug ? <Link href={`/products/${l.slug}`} className="font-heading font-bold text-navy-900 hover:underline">{l.name}</Link> : <span className="font-heading font-bold text-navy-900">{it.sku}</span>}
                  <p className="text-sm text-slate-600">{l?.found ? `${it.sku} · ${l.packLabel}` : it.sku}</p>
                  {l?.found && <p className="text-sm font-semibold text-teal-700">{formatUsd(l.unitPriceCents ?? 0)} / case</p>}
                </div>
                <QuantityStepper value={it.quantity} onChange={(v) => setQuantity(it.sku, v)} max={l?.found ? Math.max(1, l.available ?? 1) : undefined} />
                <div className="w-24 text-right font-heading text-lg font-bold text-navy-900">{l?.found ? formatUsd((l.unitPriceCents ?? 0) * it.quantity) : "—"}</div>
                <button type="button" onClick={() => remove(it.sku)} aria-label={`Remove ${l?.name ?? it.sku}`} className="grid size-11 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="size-5" />
                </button>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-heading text-lg font-bold text-navy-900">Order summary</h2>
          {quote ? (
            <>
              {remaining > 0 ? (
                <p className="rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-700">Add {formatUsd(remaining)} more for free delivery.</p>
              ) : (
                <p className="rounded-lg bg-teal-50 p-3 text-sm font-medium text-teal-700">You&apos;ve unlocked free next-day delivery.</p>
              )}
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-600">Subtotal</dt><dd className="font-semibold">{formatUsd(quote.subtotalCents)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-600">Delivery (estimate)</dt><dd className="font-semibold">{quote.deliveryFeeCents === 0 ? "FREE" : formatUsd(quote.deliveryFeeCents)}</dd></div>
                <div className="flex justify-between border-t pt-3 text-base"><dt className="font-bold">Estimated total</dt><dd className="font-heading text-xl font-extrabold text-navy-900">{formatUsd(quote.totalCents)}</dd></div>
              </dl>
            </>
          ) : (
            <p className="text-sm text-slate-600">{loading ? "Calculating…" : "—"}</p>
          )}
          <Link
            href="/checkout"
            aria-disabled={problems.length > 0 || !quote}
            className={`flex h-12 items-center justify-center gap-2 rounded-xl font-semibold text-white ${problems.length > 0 || !quote ? "pointer-events-none bg-slate-400" : "bg-navy-700 hover:bg-navy-900"}`}
          >
            Continue to checkout <ArrowRight className="size-4" />
          </Link>
          <p className="text-xs text-slate-500">Prices and availability are confirmed by our server when you place the order. Demo store — no payment is taken.</p>
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 font-heading text-3xl font-extrabold text-navy-900">Shopping cart</h1>
      {children}
    </div>
  );
}
