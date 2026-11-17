import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("size-11", className)} aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="#163A7A" />
      <path d="M11 12v16a7 7 0 0 0 14 0V12" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="M31 36V12h5a6.5 6.5 0 0 1 0 13h-5" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M33.5 17.5l3-1.7 3 1.7v3.4l-3 1.7-3-1.7z" fill="#0F766E" />
    </svg>
  );
}

export function Logo({ href = "/", light = false, className }: { href?: string; light?: boolean; className?: string }) {
  return (
    <Link href={href} aria-label="United Papers home" className={cn("flex items-center gap-3", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className={cn("font-heading text-[19px] font-extrabold tracking-wide", light ? "text-white" : "text-navy-900")}>UNITED PAPERS</span>
        <span className={cn("mt-1 text-[10px] font-semibold tracking-[0.16em]", light ? "text-navy-100" : "text-slate-600")}>PAPER PRODUCTS &amp; PACKAGING</span>
      </span>
    </Link>
  );
}
