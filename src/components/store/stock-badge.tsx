import { cn } from "@/lib/utils";
import type { StockLevel } from "@/server/catalog";

const MAP = {
  in: { label: "In stock", cls: "bg-teal-50 text-teal-700" },
  low: { label: "Low stock", cls: "bg-amber-50 text-amber-700" },
  out: { label: "Out of stock", cls: "bg-red-50 text-red-700" },
} as const;

export function StockBadge({ level, className }: { level: StockLevel; className?: string }) {
  const m = MAP[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", m.cls, className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {m.label}
    </span>
  );
}
