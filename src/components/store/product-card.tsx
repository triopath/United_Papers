import Link from "next/link";
import { ProductArt } from "@/components/brand/product-art";
import { formatUsd } from "@/lib/pricing";
import type { CatalogProduct } from "@/server/catalog";
import { StockBadge } from "./stock-badge";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const prices = product.variants.map((v) => v.casePriceCents);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const best = product.variants.find((v) => v.stock !== "out") ?? product.variants[0];
  const allOut = product.variants.every((v) => v.stock === "out");
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="block" aria-label={`View ${product.name}`}>
        <ProductArt kind={product.imageKind} imageUrl={product.imageUrl} alt={product.name} className="aspect-[4/3] w-full" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">{product.category.name}</span>
        <Link href={`/products/${product.slug}`} className="font-heading text-base font-bold leading-snug text-navy-900 hover:underline">{product.name}</Link>
        <p className="text-sm text-slate-600">
          {product.variants.length > 1 ? `${product.variants.length} sizes` : best.packLabel}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <div className="font-heading text-xl font-extrabold text-navy-900">
              {min === max ? formatUsd(min) : `${formatUsd(min)}–${formatUsd(max)}`}
              <span className="ml-1 text-xs font-medium text-slate-600">/ case</span>
            </div>
            <div className="text-xs font-semibold text-teal-700">{best.unitPriceLabel}</div>
          </div>
          <StockBadge level={allOut ? "out" : product.variants.some((v) => v.stock === "in") ? "in" : "low"} />
        </div>
        <Link href={`/products/${product.slug}`} className="mt-2 inline-flex h-10 items-center justify-center rounded-lg border border-navy-700 text-sm font-semibold text-navy-700 hover:bg-navy-50">
          {product.variants.length > 1 ? "Choose size" : "View & add to cart"}
        </Link>
      </div>
    </article>
  );
}
