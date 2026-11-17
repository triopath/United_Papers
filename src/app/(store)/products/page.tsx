import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { listCategories, listProducts } from "@/server/catalog";
import { cn } from "@/lib/utils";

export const metadata = { title: "Catalog" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const sp = await searchParams;
  const category = sp.category && /^[a-z0-9-]{1,60}$/.test(sp.category) ? sp.category : undefined;
  const q = sp.q?.slice(0, 60);
  const [cats, products] = await Promise.all([listCategories(), listProducts({ category, q })]);
  const active = cats.find((c) => c.slug === category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-600">
        <Link href="/" className="hover:underline">Home</Link> / <span className="font-semibold text-slate-900">{active?.name ?? "All products"}</span>
      </nav>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-navy-900">{q ? `Results for “${q}”` : active?.name ?? "All products"}</h1>
          <p className="text-slate-600">{active?.description ?? "Wholesale foodservice packaging, priced by the case."} · {products.length} product{products.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside aria-label="Categories" className="h-fit rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 font-heading text-sm font-bold uppercase tracking-wide text-slate-500">Category</h2>
          <ul className="space-y-1">
            <li><Link href="/products" className={cn("block rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50", !category && "bg-navy-50 font-bold text-navy-900")}>All products</Link></li>
            {cats.map((c) => (
              <li key={c.slug}>
                <Link href={`/products?category=${c.slug}`} className={cn("flex justify-between rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50", category === c.slug && "bg-navy-50 font-bold text-navy-900")}>
                  {c.name}<span className="text-slate-500">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <section aria-label="Products">
          {products.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <PackageSearch className="mb-3 size-10 text-slate-400" aria-hidden="true" />
              <h2 className="font-heading text-xl font-bold text-navy-900">No products found</h2>
              <p className="mt-1 max-w-sm text-slate-600">Try a different search term, or browse all categories.</p>
              <Link href="/products" className="mt-4 inline-flex h-10 items-center rounded-lg bg-navy-700 px-4 text-sm font-semibold text-white hover:bg-navy-900">Clear filters</Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
