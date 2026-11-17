import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductArt } from "@/components/brand/product-art";
import { ProductCard } from "@/components/store/product-card";
import { getProductBySlug, listProducts } from "@/server/catalog";
import { VariantBuyBox } from "./variant-buy-box";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  return { title: p?.name ?? "Product not found" };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) notFound();
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = (await listProducts({ category: product.category.slug })).filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-600">
        <Link href="/" className="hover:underline">Home</Link> / <Link href={`/products?category=${product.category.slug}`} className="hover:underline">{product.category.name}</Link> / <span className="font-semibold text-slate-900">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <ProductArt kind={product.imageKind} imageUrl={product.imageUrl} alt={product.name} className="aspect-square w-full rounded-3xl border border-slate-200" priority />
          {!product.imageUrl && <p className="text-xs text-slate-500">Illustration shown — product photography to be supplied.</p>}
        </div>
        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-teal-700">{product.category.name}</p>
            <h1 className="mt-1 font-heading text-3xl font-extrabold leading-tight text-navy-900 sm:text-4xl">{product.name}</h1>
            <p className="mt-3 text-slate-700">{product.description}</p>
          </div>
          <VariantBuyBox variants={product.variants} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14" aria-labelledby="rel-h">
          <h2 id="rel-h" className="mb-5 font-heading text-2xl font-extrabold text-navy-900">More from {product.category.name}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
