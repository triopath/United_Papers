import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function StoreFooter() {
  return (
    <footer className="mt-auto bg-navy-900 text-navy-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo light />
          <p className="max-w-xs text-sm leading-relaxed">Wholesale paper products and foodservice packaging for restaurants, cafés, caterers and food trucks.</p>
        </div>
        <FooterCol title="Shop" links={[["All products", "/products"], ["Paper Cups & Lids", "/products?category=cups-lids"], ["Food Containers", "/products?category=food-containers"], ["Trash Liners", "/products?category=trash-liners"]]} />
        <FooterCol title="Your order" links={[["Cart", "/cart"], ["Checkout", "/checkout"]]} />
        <div className="space-y-2 text-sm">
          <h3 className="font-heading font-bold text-white">Delivery</h3>
          <p>Next-day local delivery on orders placed before the cutoff.</p>
          <p className="text-xs text-navy-100/80">[Service ZIP codes, cutoff time and fees to be confirmed with the owner.]</p>
        </div>
      </div>
      <div className="border-t border-navy-800">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs">
          <span>© 2026 United Papers — demonstration build. All data is synthetic.</span>
          <Link href="/admin" className="hover:text-white">Staff login</Link>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div className="space-y-3 text-sm">
      <h3 className="font-heading font-bold text-white">{title}</h3>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
