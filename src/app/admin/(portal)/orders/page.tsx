import Link from "next/link";
import { EmptyRow, fmtDate, PageHeader, Panel, StatusPill, td, th } from "@/components/admin/ui";
import { formatUsd } from "@/lib/pricing";
import { requireAdminPage } from "@/server/auth";
import { listOrders } from "@/server/admin-data";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdminPage();
  const { q } = await searchParams;
  const orders = await listOrders({ q });

  return (
    <>
      <PageHeader title="Orders" subtitle={`${orders.length} order${orders.length === 1 ? "" : "s"} stored in the database.`}>
        <form role="search" className="flex">
          <label htmlFor="oq" className="sr-only">Search orders</label>
          <input id="oq" name="q" defaultValue={q} placeholder="Order # or business…" className="h-10 w-56 rounded-lg border border-slate-300 bg-white px-3 text-sm" />
        </form>
      </PageHeader>
      <Panel>
        {orders.length === 0 ? (
          <EmptyRow text={q ? "No orders match your search." : "No orders yet."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead><tr className="border-b border-slate-100"><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Placed</th><th className={th}>Method</th><th className={`${th} text-right`}>Cases</th><th className={th}>Status</th><th className={`${th} text-right`}>Total</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-semibold text-navy-700 hover:underline">{o.orderNumber}</Link></td>
                    <td className={td}>{o.company}</td>
                    <td className={`${td} text-slate-600`}>{fmtDate(o.createdAt)}</td>
                    <td className={`${td} text-slate-600`}>{o.deliveryMethod === "PICKUP" ? "Pickup" : "Delivery"}</td>
                    <td className={`${td} text-right`}>{o.cases}</td>
                    <td className={td}><StatusPill status={o.status} /></td>
                    <td className={`${td} text-right font-semibold`}>{formatUsd(o.totalCents)}</td>
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
