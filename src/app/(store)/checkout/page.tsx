"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldAlert } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { useQuote } from "@/components/store/use-quote";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { computeTotals, formatUsd, type DeliveryMethod } from "@/lib/pricing";

const formSchema = z.object({
  companyName: z.string().trim().min(1, "Required").max(120),
  contactName: z.string().trim().min(1, "Required").max(80),
  email: z.string().trim().email("Enter a valid email").max(120),
  phone: z.string().trim().min(7, "Enter a phone number").max(30),
  addressLine: z.string().trim().min(1, "Required").max(160),
  city: z.string().trim().min(1, "Required").max(80),
  state: z.string().trim().length(2, "2-letter state"),
  zip: z.string().trim().regex(/^\d{5}$/, "5-digit ZIP"),
  notes: z.string().trim().max(300).optional(),
});
type FormValues = z.infer<typeof formSchema>;

const KEY_STORE = "up-checkout-key";

/**
 * One key per checkout attempt, kept in sessionStorage until the order succeeds:
 * a retry, refresh or double-click re-sends the SAME key, so it cannot create (or reserve) twice.
 */
function getCheckoutKey(): string {
  let k = sessionStorage.getItem(KEY_STORE);
  if (!k) {
    k = crypto.randomUUID();
    sessionStorage.setItem(KEY_STORE, k);
  }
  return k;
}

// Demo storefront identity: pre-filled synthetic business so a demo takes seconds.
const DEMO_DEFAULTS: FormValues = {
  companyName: "Demo Bistro (sample buyer)",
  contactName: "Dana Demo",
  email: "buyer@demobistro.example.test",
  phone: "630-555-0199",
  addressLine: "100 Sample Street",
  city: "Naperville",
  state: "IL",
  zip: "60540",
  notes: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, ready, clear } = useCart();
  const { quote, error: quoteError } = useQuote(items, ready);
  const [method, setMethod] = useState<DeliveryMethod>("DELIVERY");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: DEMO_DEFAULTS });

  if (!ready) return <Wrap><p className="py-20 text-center text-slate-600">Loading…</p></Wrap>;
  if (items.length === 0) {
    return (
      <Wrap>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-700">Your cart is empty.</p>
          <Link href="/products" className="mt-4 inline-flex h-11 items-center rounded-lg bg-navy-700 px-5 font-semibold text-white">Browse the catalog</Link>
        </div>
      </Wrap>
    );
  }

  const priced = (quote?.lines ?? []).filter((l) => l.found) as Required<Pick<NonNullable<typeof quote>["lines"][number], "unitPriceCents" | "quantity">>[];
  const totals = computeTotals(priced.map((l) => ({ unitPriceCents: l.unitPriceCents!, quantity: l.quantity })), method);
  const blocked = !quote || quote.lines.some((l) => !l.found || l.ok === false);

  async function onSubmit(values: FormValues) {
    if (submitting || blocked) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const { notes, ...customer } = values;
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: getCheckoutKey(), items, deliveryMethod: method, customer, notes: notes || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        sessionStorage.removeItem(KEY_STORE);
        clear();
        router.push(`/order/${data.orderId}`);
        return;
      }
      setServerError(
        data.code === "INSUFFICIENT_STOCK"
          ? `${data.error}. Please adjust your cart and try again.`
          : res.status === 429
            ? "Too many attempts — please wait a minute and try again."
            : data.error ?? "Something went wrong. Please try again.",
      );
    } catch {
      setServerError("Network problem — your order was not placed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const f = (name: keyof FormValues, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} aria-invalid={!!errors[name]} className="h-11" {...register(name)} {...props} />
      {errors[name] && <p className="text-xs font-medium text-red-700">{errors[name]?.message}</p>}
    </div>
  );

  return (
    <Wrap>
      <div className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p><b>Demo checkout.</b> No payment is collected and nothing will be shipped. The order is real in the database so you can see it, and its stock, in the admin portal.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6" aria-labelledby="del-h">
            <h2 id="del-h" className="font-heading text-lg font-bold text-navy-900">1. Delivery</h2>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Delivery method">
              {(["DELIVERY", "PICKUP"] as const).map((m) => (
                <label key={m} className={`cursor-pointer rounded-xl border-2 p-4 ${method === m ? "border-navy-700 bg-navy-50" : "border-slate-200"}`}>
                  <input type="radio" name="method" className="sr-only" checked={method === m} onChange={() => setMethod(m)} />
                  <span className="block font-semibold text-navy-900">{m === "DELIVERY" ? "Next-day delivery" : "Warehouse pickup"}</span>
                  <span className="text-sm text-slate-600">{m === "DELIVERY" ? "Free over $200 · otherwise $15.00" : "Free · ready in 2 hours"}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6" aria-labelledby="biz-h">
            <h2 id="biz-h" className="font-heading text-lg font-bold text-navy-900">2. Business &amp; delivery address</h2>
            <p className="text-xs text-slate-500">Pre-filled with a sample demo buyer — feel free to edit.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {f("companyName", "Business name")}
              {f("contactName", "Contact name")}
              {f("email", "Email", { type: "email", autoComplete: "email" })}
              {f("phone", "Phone", { type: "tel" })}
            </div>
            {f("addressLine", "Street address")}
            <div className="grid gap-4 sm:grid-cols-[1fr_90px_130px]">
              {f("city", "City")}
              {f("state", "State", { maxLength: 2 })}
              {f("zip", "ZIP", { inputMode: "numeric", maxLength: 5 })}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes for the driver (optional)</Label>
              <Textarea id="notes" rows={2} {...register("notes")} />
            </div>
          </section>

          <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-heading text-lg font-bold text-navy-900">3. Payment</h2>
            <p className="text-sm text-slate-700">Simulated for this demo — <b>no card or bank details are requested</b>. In the full build this step offers card, ACH and approved invoice terms.</p>
          </section>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-6 lg:sticky lg:top-44" aria-label="Order summary">
          <h2 className="font-heading text-lg font-bold text-navy-900">Order summary</h2>
          {quoteError && <p role="alert" className="text-sm text-red-700">{quoteError}</p>}
          <ul className="divide-y divide-slate-100 text-sm">
            {(quote?.lines ?? []).map((l) => (
              <li key={l.sku} className="flex justify-between gap-3 py-2">
                <span>{l.found ? l.name : l.sku}<span className="block text-xs text-slate-500">{l.quantity} × {l.found ? formatUsd(l.unitPriceCents ?? 0) : "unavailable"}</span>{l.found && l.ok === false && <span className="block text-xs font-semibold text-red-700">Only {l.available} available</span>}</span>
                <span className="font-semibold">{l.found ? formatUsd((l.unitPriceCents ?? 0) * l.quantity) : "—"}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-600">Subtotal</dt><dd>{formatUsd(totals.subtotalCents)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">{method === "PICKUP" ? "Pickup" : "Delivery"}</dt><dd>{totals.deliveryFeeCents === 0 ? "FREE" : formatUsd(totals.deliveryFeeCents)}</dd></div>
            <div className="flex justify-between border-t pt-3 text-base"><dt className="font-bold">Total</dt><dd className="font-heading text-xl font-extrabold text-navy-900">{formatUsd(totals.totalCents)}</dd></div>
          </dl>
          {serverError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">{serverError}</p>}
          <Button type="submit" disabled={submitting || blocked} className="h-12 w-full gap-2 bg-navy-700 text-base hover:bg-navy-900">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "Placing order…" : "Place demo order"}
          </Button>
          {blocked && quote && <p className="text-xs text-red-700">Fix the unavailable items in your <Link href="/cart" className="underline">cart</Link> to continue.</p>}
        </aside>
      </form>
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 font-heading text-3xl font-extrabold text-navy-900">Checkout</h1>
      {children}
    </div>
  );
}
