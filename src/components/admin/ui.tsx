import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-navy-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default" | "warn" | "good" }) {
  return (
    <div className={cn("rounded-2xl border p-5", tone === "warn" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")}>
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className={cn("mt-1 font-heading text-3xl font-extrabold", tone === "warn" ? "text-amber-700" : "text-navy-900")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-600">{hint}</p>}
    </div>
  );
}

const STATUS: Record<string, string> = {
  CONFIRMED: "bg-navy-50 text-navy-700",
  PICKED: "bg-amber-50 text-amber-700",
  PACKED: "bg-teal-50 text-teal-700",
  DISPATCHED: "bg-sky-50 text-sky-800",
  DELIVERED: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-red-50 text-red-700",
  ok: "bg-teal-50 text-teal-700",
  low: "bg-amber-50 text-amber-700",
  out: "bg-red-50 text-red-700",
};

export function StatusPill({ status, label }: { status: string; label?: string }) {
  const text = label ?? status.charAt(0) + status.slice(1).toLowerCase();
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", STATUS[status] ?? "bg-slate-100 text-slate-700")}>{text}</span>;
}

export function Panel({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-heading text-lg font-bold text-navy-900">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyRow({ text }: { text: string }) {
  return <p className="px-5 py-10 text-center text-sm text-slate-600">{text}</p>;
}

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export const th = "px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500";
export const td = "px-4 py-3 text-sm";
