import Link from "next/link";
import { Search, Truck, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { CartButton } from "./cart-button";
import { listCategories } from "@/server/catalog";

export async function StoreHeader() {
  const cats = await listCategories();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      {process.env.NEXT_PUBLIC_DEMO_BANNER !== "false" && (
        <div className="bg-amber-50 px-4 py-1.5 text-center text-xs font-medium text-amber-700">
          DEMO STORE — synthetic products and prices. Orders are simulated; no payment is taken and nothing is shipped.
        </div>
      )}
      <div className="bg-navy-900 text-xs text-navy-100">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2">
          <span className="flex items-center gap-2"><Truck className="size-4 text-teal-100" aria-hidden="true" />Free next-day delivery on orders over $200 (demo terms)</span>
          <span className="flex items-center gap-2"><Phone className="size-4" aria-hidden="true" />[Your phone number]</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Logo />
        <form action="/products" role="search" className="order-3 flex min-w-0 flex-1 basis-full md:order-none md:basis-0">
          <label htmlFor="site-search" className="sr-only">Search products or SKU</label>
          <input id="site-search" name="q" type="search" placeholder="Search cups, containers, foil… or SKU like UP-CUP-H16" className="h-11 min-w-0 flex-1 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-4 text-sm outline-none focus:border-navy-700 focus:bg-white" />
          <button type="submit" aria-label="Search" className="grid h-11 w-14 place-items-center rounded-r-lg bg-navy-700 text-white hover:bg-navy-900">
            <Search className="size-5" />
          </button>
        </form>
        <div className="ml-auto md:ml-0"><CartButton /></div>
      </div>
      <nav aria-label="Categories" className="border-t border-slate-100">
        <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 text-sm font-semibold text-slate-700">
          <li><Link href="/products" className="block whitespace-nowrap px-3 py-3 text-navy-700 hover:text-navy-900">All products</Link></li>
          {cats.map((c) => (
            <li key={c.slug}>
              <Link href={`/products?category=${c.slug}`} className="block whitespace-nowrap px-3 py-3 hover:text-navy-900">{c.name}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
