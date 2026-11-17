import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { formatUsd } from "@/lib/pricing";
import { getOrderConfirmation } from "@/server/catalog";

export const metadata = { title: "Order confirmed" };

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderConfirmation(id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="size-10 shrink-0 text-teal-700" aria-hidden="true" />
          <div>
            <h1 className="font-heading text-3xl font-extrabold text-navy-900">Order confirmed</h1>
            <p className="mt-1 text-slate-600">Your stock is reserved. A confirmation would be emailed in the full build.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 rounded-2xl bg-navy-50 p-5 sm:grid-cols-3">
          <Info label="Order number" value={order.orderNumber} strong />
          <Info label={order.deliveryMethod === "PICKUP" ? "Pickup" : "Delivering to"} value={order.deliveryMethod === "PICKUP" ? "Warehouse" : order.city} />
          <Info label="Business" value={order.company} />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Item</th><th className="px-3 py-2 text-right">Cases</th><th className="px-3 py-2 text-right">Price</th><th className="py-2 pl-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.lines.map((l) => (
                <tr key={l.sku}>
                  <td className="py-3 pr-3"><span className="font-semibold text-slate-900">{l.name}</span><span className="block text-xs text-slate-500">{l.sku} · {l.packLabel}</span></td>
                  <td className="px-3 py-3 text-right">{l.quantity}</td>
                  <td className="px-3 py-3 text-right">{formatUsd(l.unitPriceCents)}</td>
                  <td className="py-3 pl-3 text-right font-semibold">{formatUsd(l.lineTotalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="ml-auto mt-4 w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-slate-600">Subtotal</dt><dd>{formatUsd(order.subtotalCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-600">Delivery</dt><dd>{order.deliveryFeeCents === 0 ? "FREE" : formatUsd(order.deliveryFeeCents)}</dd></div>
          <div className="flex justify-between border-t pt-2 text-base"><dt className="font-bold">Total</dt><dd className="font-heading text-xl font-extrabold">{formatUsd(order.totalCents)}</dd></div>
        </dl>

        <p className="mt-6 rounded-lg bg-amber-50 p-3 text-xs font-medium text-amber-700">DEMO ORDER — no payment was taken and nothing will ship.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/products" className="inline-flex h-11 items-center rounded-lg bg-navy-700 px-5 font-semibold text-white hover:bg-navy-900">Continue shopping</Link>
          <Link href="/admin" className="inline-flex h-11 items-center rounded-lg border border-navy-700 px-5 font-semibold text-navy-700 hover:bg-navy-50">View in admin portal</Link>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={strong ? "font-heading text-2xl font-extrabold text-navy-900" : "font-semibold text-slate-900"}>{value}</p>
    </div>
  );
}
