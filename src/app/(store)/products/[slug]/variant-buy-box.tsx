"use client";

import { useState } from "react";
import { AddToCart } from "@/components/store/add-to-cart";
import { StockBadge } from "@/components/store/stock-badge";
import { formatUsd } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { CatalogVariant } from "@/server/catalog";

export function VariantBuyBox({ variants }: { variants: CatalogVariant[] }) {
  const firstInStock = variants.find((v) => v.stock !== "out") ?? variants[0];
  const [sku, setSku] = useState(firstInStock.sku);
  const v = variants.find((x) => x.sku === sku) ?? variants[0];

  return (
    <div className="space-y-5">
      {variants.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-slate-700">Size / option</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((x) => (
              <button
                key={x.sku}
                type="button"
                aria-pressed={x.sku === sku}
                onClick={() => setSku(x.sku)}
                className={cn(
                  "min-h-11 rounded-lg border px-4 text-sm font-semibold transition",
                  x.sku === sku ? "border-navy-700 bg-navy-700 text-white" : "border-slate-300 bg-white text-slate-800 hover:border-navy-700",
                  x.stock === "out" && x.sku !== sku && "opacity-60",
                )}
              >
                {x.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-heading text-4xl font-extrabold text-navy-900">
              {formatUsd(v.casePriceCents)} <span className="text-base font-medium text-slate-600">/ case</span>
            </div>
            <p className="mt-1 text-sm text-slate-700">{v.packLabel} · <span className="font-semibold text-teal-700">{v.unitPriceLabel}</span></p>
          </div>
          <StockBadge level={v.stock} />
        </div>
        <p className="mt-2 text-sm text-slate-600" aria-live="polite">
          {v.stock === "out" ? "Currently unavailable." : v.stock === "low" ? `Only ${v.available} case${v.available === 1 ? "" : "s"} left.` : `${v.available} cases available.`}
        </p>
        <div className="mt-4"><AddToCart key={v.sku} sku={v.sku} available={v.available} size="lg" /></div>
        <p className="mt-3 text-xs text-slate-500">SKU {v.sku} · Demo price. Free delivery on orders over $200.</p>
      </div>

      {Object.keys(v.specs).length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <h2 className="border-b border-slate-100 px-5 py-3 font-heading text-base font-bold text-navy-900">Specifications</h2>
          <dl className="divide-y divide-slate-100 text-sm">
            <Row k="SKU" v={v.sku} />
            <Row k="Pack" v={v.packLabel} />
            <Row k="Units per case" v={v.unitsPerCase.toLocaleString("en-US")} />
            {Object.entries(v.specs).map(([k, val]) => <Row key={k} k={k} v={val} />)}
          </dl>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[40%_1fr] gap-3 px-5 py-2.5">
      <dt className="font-semibold text-slate-600">{k}</dt>
      <dd className="text-slate-900">{v}</dd>
    </div>
  );
}
