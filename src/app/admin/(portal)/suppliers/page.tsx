import { EmptyRow, PageHeader, Panel, td, th } from "@/components/admin/ui";
import { requireAdminPage } from "@/server/auth";
import { listSuppliers } from "@/server/admin-data";

export const metadata = { title: "Suppliers" };

export default async function AdminSuppliersPage() {
  await requireAdminPage();
  const rows = await listSuppliers();
  return (
    <>
      <PageHeader title="Suppliers & manufacturers" subtitle="Fictional demo suppliers. Purchase orders, quotes and goods receiving are part of the full build." />
      <Panel>
        {rows.length === 0 ? <EmptyRow text="No suppliers yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead><tr className="border-b border-slate-100"><th className={th}>Supplier</th><th className={th}>Contact</th><th className={`${th} text-right`}>Lead time</th><th className={`${th} text-right`}>Min. order</th><th className={`${th} text-right`}>SKUs supplied</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className={`${td} font-semibold`}>{s.name}</td>
                    <td className={td}>{s.contactName}<span className="block text-xs text-slate-500">{s.email}</span></td>
                    <td className={`${td} text-right`}>{s.leadTimeDays} days</td>
                    <td className={`${td} text-right`}>{s.minOrderCases} cases</td>
                    <td className={`${td} text-right`}>{s.skuCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
