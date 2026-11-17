"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Boxes, Factory, LayoutDashboard, LogOut, Package, ShoppingBag, Store, Users } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/suppliers", label: "Suppliers", icon: Factory },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <aside className="flex shrink-0 flex-col gap-4 bg-navy-900 p-4 text-navy-100 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:gap-6 lg:p-5">
      <div className="flex items-center justify-between lg:block">
        <Logo href="/admin" light />
        <button type="button" onClick={logout} className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-navy-800 lg:hidden" aria-label="Sign out">
          <LogOut className="size-4" />
        </button>
      </div>
      <nav aria-label="Admin" className="-mx-1 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {NAV.map((n) => {
          const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={cn("flex h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-semibold", active ? "bg-navy-700 text-white" : "hover:bg-navy-800")}
            >
              <n.icon className="size-5" aria-hidden="true" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden space-y-2 lg:block">
        <Link href="/" className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold hover:bg-navy-800"><Store className="size-4" />View storefront</Link>
        <div className="rounded-lg bg-navy-800 p-3 text-xs">
          <p className="truncate font-semibold text-white">{email}</p>
          <p>Owner · demo environment</p>
        </div>
        <button type="button" onClick={logout} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold hover:bg-navy-800"><LogOut className="size-4" />Sign out</button>
      </div>
    </aside>
  );
}
