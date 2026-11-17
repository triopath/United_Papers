import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { EmptyRow, fmtDate, PageHeader, Panel, StatCard, StatusPill, td, th } from "@/components/admin/ui";
import { formatUsd } from "@/lib/pricing";
import { requireAdminPage } from "@/server/auth";
import { getDashboard } from "@/server/admin-data";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  await requireAdminPage();
  const d = await getDashboard();
  const maxDay = Math.max(1, ...d.days.map((x) => x.totalCents));

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Live figures calculated from the orders and inventory stored in PostgreSQL." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total orders" value={String(d.totalOrders)} hint={`${d.ordersToday} today`} />
        <StatCard label="Order revenue" value={formatUsd(d.revenueCents)} hint={`${formatUsd(d.revenueTodayCents)} today`} />
        <StatCard label="Cases reserved" value={d.reservedCases.toLocaleString("en-US")} hint={`of ${d.onHandCases.toLocaleString("en-US")} cases on hand`} />
        <StatCard label="Low-stock SKUs" value={String(d.lowStock.length)} hint={`${d.outOfStockCount} out of stock`} tone={d.lowStock.length ? "warn" : "good"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Sales — last 7 days">
          <div className="p-5">
            <div className="flex h-48 items-end gap-3" role="img" aria-label="Bar chart of daily sales for the last seven days">
              {d.days.map((x, i) => (
                <div key={i} className="flex flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-xs font-semibold text-slate-600">{x.totalCents ? formatUsd(x.totalCents).replace(".00", "") : ""}</span>
                  <div className="w-full rounded-t-md bg-navy-700" style={{ height: `${Math.max(x.totalCents ? 6 : 2, (x.totalCents / maxDay) * 100)}%`, opacity: x.totalCents ? 1 : 0.15 }} />
                  <span className="text-xs text-slate-600">{x.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Needs reordering" action={<Link href="/admin/inventory" className="text-sm font-semibold text-navy-700 hover:underline">All inventory →</Link>}>
          {d.lowStock.length === 0 ? (
            <EmptyRow text="All SKUs are above their reorder point." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.lowStock.slice(0, 6).map((s) => (
                <li key={s.sku} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-600">{s.sku} · reorder at {s.reorderPoint}</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-amber-700"><AlertTriangle className="size-4" aria-hidden="true" />{Math.max(0, s.available)} avail.</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Recent orders" action={<Link href="/admin/orders" className="text-sm font-semibold text-navy-700 hover:underline">All orders →</Link>}>
        {d.recent.length === 0 ? (
          <EmptyRow text="No orders yet. Place one from the storefront." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead><tr className="border-b border-slate-100"><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Placed</th><th className={th}>Status</th><th className={`${th} text-right`}>Total</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {d.recent.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-semibold text-navy-700 hover:underline">{o.orderNumber}</Link></td>
                    <td className={td}>{o.company}</td>
                    <td className={`${td} text-slate-600`}>{fmtDate(o.createdAt)}</td>
                    <td className={td}><StatusPill status={o.status} /></td>
                    <td className={`${td} text-right font-semibold`}>{formatUsd(o.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="text-xs text-slate-500">Stock value at cost: {formatUsd(d.stockValueCents)} across {d.skuCount} SKUs. Management view for the demo — not an accounting close.</p>
    </>
  );
}
