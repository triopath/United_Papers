import { PageHeader, Panel, StatCard, StatusPill, td, th } from "@/components/admin/ui";
import { formatUsd } from "@/lib/pricing";
import { requireAdminPage } from "@/server/auth";
import { listInventory } from "@/server/admin-data";

export const metadata = { title: "Inventory" };

export default async function AdminInventoryPage() {
  await requireAdminPage();
  const rows = await listInventory();
  const low = rows.filter((r) => r.status === "low").length;
  const out = rows.filter((r) => r.status === "out").length;
  const reserved = rows.reduce((s, r) => s + r.reserved, 0);
  const value = rows.reduce((s, r) => s + r.valueCents, 0);
  const order = { out: 0, low: 1, ok: 2 } as const;
  const sorted = [...rows].sort((a, b) => order[a.status as keyof typeof order] - order[b.status as keyof typeof order] || a.sku.localeCompare(b.sku));

  return (
    <>
      <PageHeader title="Inventory" subtitle="Available to sell = on hand − reserved by open orders. Reservations happen atomically at checkout." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="SKUs tracked" value={String(rows.length)} />
        <StatCard label="Cases reserved" value={reserved.toLocaleString("en-US")} hint="held for open orders" />
        <StatCard label="Low / out of stock" value={`${low} / ${out}`} tone={low + out ? "warn" : "good"} />
        <StatCard label="Stock value at cost" value={formatUsd(value)} />
      </div>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={th}>SKU</th><th className={th}>Product</th><th className={th}>Supplier</th>
                <th className={`${th} text-right`}>On hand</th><th className={`${th} text-right`}>Reserved</th><th className={`${th} text-right`}>Available</th>
                <th className={`${th} text-right`}>Reorder at</th><th className={th}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((r) => (
                <tr key={r.sku} className="hover:bg-slate-50">
                  <td className={`${td} font-mono text-xs`}>{r.sku}</td>
                  <td className={td}>{r.product}<span className="block text-xs text-slate-500">{r.category} · {r.packLabel}</span></td>
                  <td className={`${td} text-slate-600`}>{r.supplier}</td>
                  <td className={`${td} text-right`}>{r.onHand}</td>
                  <td className={`${td} text-right text-slate-600`}>{r.reserved}</td>
                  <td className={`${td} text-right font-bold ${r.status === "ok" ? "" : r.status === "out" ? "text-red-700" : "text-amber-700"}`}>{r.available}</td>
                  <td className={`${td} text-right text-slate-600`}>{r.reorderPoint}</td>
                  <td className={td}><StatusPill status={r.status} label={r.status === "ok" ? "Healthy" : r.status === "low" ? "Reorder soon" : "Out of stock"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
