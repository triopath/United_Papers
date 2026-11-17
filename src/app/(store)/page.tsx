import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Boxes, ClipboardList, ReceiptText, ShieldCheck, Truck } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { ProductArt } from "@/components/brand/product-art";
import { getFeaturedProducts, listCategories } from "@/server/catalog";

const CAT_KIND: Record<string, string> = {
  "cups-lids": "cup",
  "food-containers": "container",
  "foil-pans": "foil",
  "paper-bags": "bag",
  "cutlery-utensils": "cutlery",
  "trash-liners": "liner",
  "napkins-towels": "napkin",
  "cleaning-supplies": "glove",
};

const VALUE = [
  { icon: Boxes, title: "Priced by the case", text: "Case count and cost per piece on every item, so comparing is easy." },
  { icon: ClipboardList, title: "Live stock you can trust", text: "Stock is reserved the moment your order is placed — no surprise backorders." },
  { icon: Truck, title: "Next-day local delivery", text: "Order before the cutoff and receive it tomorrow. Free over $200." },
  { icon: ReceiptText, title: "Built for repeat buyers", text: "Reorder what you bought last week in a couple of clicks." },
];

export default async function HomePage() {
  const [cats, featured] = await Promise.all([listCategories(), getFeaturedProducts(8)]);
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:py-20">
          <div className="space-y-6">
            <span className="inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-bold tracking-wide text-teal-700">WHOLESALE FOODSERVICE PACKAGING</span>
            <h1 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-navy-900 sm:text-5xl lg:text-6xl">
              Restaurant supplies by the case. At your door tomorrow.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-slate-600">
              Cups, lids, takeout containers, foil, bags and back-of-house essentials — with clear case pricing and stock you can count on.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className="inline-flex h-12 items-center gap-2 rounded-xl bg-navy-700 px-6 font-semibold text-white hover:bg-navy-900">
                Shop the catalog <ArrowRight className="size-4" />
              </Link>
              <Link href="/products?category=cups-lids" className="inline-flex h-12 items-center rounded-xl border-2 border-navy-700 px-6 font-semibold text-navy-700 hover:bg-navy-50">
                Cups &amp; lids
              </Link>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm font-medium text-slate-700">
              <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-teal-700" />Reserved-stock ordering</li>
              <li className="flex items-center gap-2"><Truck className="size-4 text-teal-700" />Free delivery over $200</li>
            </ul>
          </div>
          <div className="relative">
            <div className="rounded-3xl bg-navy-700 p-5 sm:p-7">
              <div className="relative aspect-square overflow-hidden rounded-2xl">
                <Image src="/brand/up-cup.jpg" alt="United Papers branded paper cup and navy lid" fill priority sizes="(max-width: 1024px) 100vw, 560px" className="object-cover" />
              </div>
            </div>
            <div className="absolute -bottom-4 left-4 rounded-xl bg-white px-4 py-3 shadow-xl sm:left-[-1rem]">
              <p className="text-sm font-bold text-navy-900">16 oz hot cup · case of 1,000</p>
              <p className="text-xs text-slate-600">$0.034 per cup (demo price)</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14" aria-labelledby="cat-h">
        <div className="mb-6 flex items-end justify-between">
          <h2 id="cat-h" className="font-heading text-3xl font-extrabold text-navy-900">Shop by category</h2>
          <Link href="/products" className="text-sm font-semibold text-navy-700 hover:underline">View full catalog →</Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cats.map((c) => (
            <li key={c.slug}>
              <Link href={`/products?category=${c.slug}`} className="flex h-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                <ProductArt kind={CAT_KIND[c.slug] ?? "generic"} alt={c.name} className="size-16 shrink-0 rounded-xl" />
                <span>
                  <span className="block font-heading font-bold text-navy-900">{c.name}</span>
                  <span className="text-sm text-slate-600">{c.count} product{c.count === 1 ? "" : "s"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14" aria-labelledby="feat-h">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 id="feat-h" className="font-heading text-3xl font-extrabold text-navy-900">Featured products</h2>
            <p className="text-slate-600">Loaded live from the database, with real availability.</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-navy-700 hover:underline">See all →</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="bg-navy-900">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <h2 className="mb-8 max-w-xl font-heading text-3xl font-extrabold text-white">Built for how restaurants actually buy</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE.map((v) => (
              <div key={v.title} className="rounded-2xl bg-navy-800 p-6">
                <v.icon className="mb-4 size-7 text-teal-100" aria-hidden="true" />
                <h3 className="font-heading text-lg font-bold text-white">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-100">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-6 rounded-3xl bg-teal-50 p-8 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="space-y-3">
            <h2 className="font-heading text-2xl font-extrabold text-navy-900 sm:text-3xl">Delivery information</h2>
            <p className="max-w-xl text-slate-700">
              Place your order before the daily cutoff and we deliver the next business day. Orders of $200 or more ship free; smaller orders are a flat $15. Pickup is always free.
            </p>
            <p className="text-sm text-slate-600">[Service ZIP codes and cutoff time to be confirmed with the owner.]</p>
          </div>
          <Link href="/products" className="inline-flex h-12 items-center justify-center rounded-xl bg-teal-700 px-6 font-semibold text-white hover:bg-teal-700/90">Start an order</Link>
        </div>
      </section>
    </>
  );
}
