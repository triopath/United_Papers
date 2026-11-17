"use client";

import { Minus, Plus } from "lucide-react";
import { MAX_CASES_PER_LINE } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  max = MAX_CASES_PER_LINE,
  label = "Cases",
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  label?: string;
  className?: string;
}) {
  const cap = Math.max(1, Math.min(max, MAX_CASES_PER_LINE));
  const set = (v: number) => onChange(Math.max(1, Math.min(cap, Math.floor(v) || 1)));
  return (
    <div className={cn("inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white", className)}>
      <button type="button" aria-label={`Decrease ${label.toLowerCase()}`} disabled={value <= 1} onClick={() => set(value - 1)} className="grid size-11 place-items-center rounded-l-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40">
        <Minus className="size-4" />
      </button>
      <input
        aria-label={label}
        inputMode="numeric"
        value={value}
        onChange={(e) => set(Number(e.target.value.replace(/\D/g, "")))}
        className="h-full w-12 border-0 bg-transparent text-center text-sm font-semibold outline-none"
      />
      <button type="button" aria-label={`Increase ${label.toLowerCase()}`} disabled={value >= cap} onClick={() => set(value + 1)} className="grid size-11 place-items-center rounded-r-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40">
        <Plus className="size-4" />
      </button>
    </div>
  );
}
