import { EmptyRow, PageHeader, Panel, td, th } from "@/components/admin/ui";
import { formatUsd } from "@/lib/pricing";
import { requireAdminPage } from "@/server/auth";
import { listCustomers } from "@/server/admin-data";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  await requireAdminPage();
  const rows = await listCustomers();
  return (
    <>
      <PageHeader title="Customers" subtitle="Synthetic demo businesses. Buyers created by demo checkouts appear here too." />
      <Panel>
        {rows.length === 0 ? <EmptyRow text="No customers yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead><tr className="border-b border-slate-100"><th className={th}>Business</th><th className={th}>Contact</th><th className={th}>Location</th><th className={`${th} text-right`}>Orders</th><th className={`${th} text-right`}>Spend</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className={`${td} font-semibold`}>{c.companyName}</td>
                    <td className={td}>{c.contactName}<span className="block text-xs text-slate-500">{c.email}</span></td>
                    <td className={`${td} text-slate-600`}>{c.city}</td>
                    <td className={`${td} text-right`}>{c.orders}</td>
                    <td className={`${td} text-right font-semibold`}>{formatUsd(c.spentCents)}</td>
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
