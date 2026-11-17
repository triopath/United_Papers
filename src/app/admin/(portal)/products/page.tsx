import { PageHeader, Panel, td, th } from "@/components/admin/ui";
import { formatUsd } from "@/lib/pricing";
import { requireAdminPage } from "@/server/auth";
import { listAdminProducts } from "@/server/admin-data";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  await requireAdminPage();
  const rows = await listAdminProducts();
  return (
    <>
      <PageHeader title="Products" subtitle={`${rows.length} sellable SKUs. Prices are synthetic demo values. Editing products and prices is part of the full build.`} />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead><tr className="border-b border-slate-100"><th className={th}>SKU</th><th className={th}>Product</th><th className={th}>Category</th><th className={th}>Pack</th><th className={`${th} text-right`}>Case price</th><th className={`${th} text-right`}>Case cost</th><th className={`${th} text-right`}>Margin</th><th className={`${th} text-right`}>Available</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.sku} className="hover:bg-slate-50">
                  <td className={`${td} font-mono text-xs`}>{r.sku}</td>
                  <td className={td}>{r.name}</td>
                  <td className={`${td} text-slate-600`}>{r.category}</td>
                  <td className={`${td} text-slate-600`}>{r.packLabel}</td>
                  <td className={`${td} text-right font-semibold`}>{formatUsd(r.priceCents)}</td>
                  <td className={`${td} text-right text-slate-600`}>{formatUsd(r.costCents)}</td>
                  <td className={`${td} text-right`}>{r.marginPct}%</td>
                  <td className={`${td} text-right`}>{r.available}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
