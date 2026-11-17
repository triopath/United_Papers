import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { fmtDate, PageHeader, Panel, StatusPill, td, th } from "@/components/admin/ui";
import { formatUsd } from "@/lib/pricing";
import { requireAdminPage } from "@/server/auth";
import { getOrder } from "@/server/admin-data";

export const metadata = { title: "Order" };

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const o = await getOrder(id);
  if (!o) notFound();

  return (
    <>
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-navy-700 hover:underline"><ArrowLeft className="size-4" />All orders</Link>
      <PageHeader title={o.orderNumber} subtitle={`Placed ${fmtDate(o.createdAt)}${o.isDemo ? " · DEMO order" : ""}`}>
        <StatusPill status={o.status} />
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Line items">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead><tr className="border-b border-slate-100"><th className={th}>SKU</th><th className={th}>Product</th><th className={`${th} text-right`}>Cases</th><th className={`${th} text-right`}>Unit price</th><th className={th}>Stock</th><th className={`${th} text-right`}>Line total</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {o.lines.map((l) => (
                  <tr key={l.id}>
                    <td className={`${td} font-mono text-xs`}>{l.sku}</td>
                    <td className={td}>{l.name}<span className="block text-xs text-slate-500">{l.packLabel}</span></td>
                    <td className={`${td} text-right`}>{l.quantity}</td>
                    <td className={`${td} text-right`}>{formatUsd(l.unitPriceCents)}</td>
                    <td className={td}>{l.reservation ? <StatusPill status={l.reservation === "ACTIVE" ? "ok" : "low"} label={`Reservation ${l.reservation.toLowerCase()}`} /> : "—"}</td>
                    <td className={`${td} text-right font-semibold`}>{formatUsd(l.lineTotalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="ml-auto w-full max-w-xs space-y-1.5 p-5 text-sm">
            <div className="flex justify-between"><dt className="text-slate-600">Subtotal</dt><dd>{formatUsd(o.subtotalCents)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Delivery</dt><dd>{o.deliveryFeeCents === 0 ? "FREE" : formatUsd(o.deliveryFeeCents)}</dd></div>
            <div className="flex justify-between border-t pt-2 text-base"><dt className="font-bold">Total</dt><dd className="font-heading text-xl font-extrabold">{formatUsd(o.totalCents)}</dd></div>
            <div className="flex justify-between text-xs text-slate-600"><dt>Gross margin (on product lines)</dt><dd>{formatUsd(o.grossMarginCents)}</dd></div>
          </dl>
        </Panel>

        <div className="space-y-6">
          <Panel title="Customer">
            <dl className="space-y-3 p-5 text-sm">
              <div><dt className="text-xs font-semibold uppercase text-slate-500">Business</dt><dd className="font-semibold">{o.customer.companyName}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate-500">Contact</dt><dd>{o.customer.contactName} · {o.customer.phone}</dd><dd className="text-slate-600">{o.customer.email}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate-500">{o.deliveryMethod === "PICKUP" ? "Pickup" : "Deliver to"}</dt><dd>{o.customer.addressLine}, {o.customer.city}, {o.customer.state} {o.customer.zip}</dd></div>
              {o.notes && <div><dt className="text-xs font-semibold uppercase text-slate-500">Notes</dt><dd>{o.notes}</dd></div>}
            </dl>
          </Panel>
          <Panel title="Fulfillment">
            <p className="p-5 text-sm text-slate-700">Stock for this order is <b>reserved</b> and no longer available to other buyers. Picking, dispatch and proof of delivery are part of the full build.</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
