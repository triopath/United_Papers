import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Locally drawn, neutral product illustrations (no third-party imagery).
 * Used wherever a licensed product photograph has not been supplied.
 * Real photos can be set per product via `imageUrl`.
 */
const ART: Record<string, React.ReactNode> = {
  cup: <><path d="M16 14h32l-4 40H20z" /><path d="M17 22h30" /><path d="M20 40c10-4 14 4 24 0" /></>,
  coldcup: <><path d="M14 16h36l-5 38H19z" /><path d="M14 16c0-4 36-4 36 0" /><path d="M34 4l-3 20" /></>,
  lid: <><ellipse cx="32" cy="42" rx="22" ry="6" /><path d="M12 42c0-12 9-18 20-18s20 6 20 18" /><path d="M27 30h10" /></>,
  container: <><path d="M8 26h48l-4 24H12z" /><path d="M8 26l3-8h42l3 8" /><path d="M16 34h32" /></>,
  clamshell: <><path d="M8 34l4-14h40l4 14v12H8z" /><path d="M8 34h48" /><path d="M28 34v4h8v-4" /></>,
  bowl: <><path d="M8 28h48c0 14-10 22-24 22S8 42 8 28z" /><path d="M12 28c0-6 9-10 20-10s20 4 20 10" /></>,
  foil: <><path d="M8 22h38v22H8z" /><ellipse cx="46" cy="33" rx="6" ry="11" /><ellipse cx="46" cy="33" rx="2" ry="4" /></>,
  pan: <><path d="M6 24h52l-6 24H12z" /><path d="M12 24l2-6h36l2 6" /><path d="M20 32h24" /></>,
  bag: <><path d="M16 22h32l-2 32H18z" /><path d="M16 22l3-8h26l3 8" /><path d="M26 22v-5M38 22v-5" /></>,
  cutlery: <><path d="M20 10v14a5 5 0 0 0 10 0V10M25 10v44" /><path d="M44 10c-5 6-5 18 0 22v22" /></>,
  straw: <><path d="M40 6L26 54" /><path d="M46 8L32 56" /><path d="M32 30l8 2" /></>,
  liner: <><path d="M18 20c0-4 5-7 14-7s14 3 14 7l2 34H16z" /><path d="M26 12l6 6 6-6" /></>,
  napkin: <><path d="M10 16h44v32H10z" /><path d="M10 16l44 32M22 48l32-24" /></>,
  glove: <><path d="M22 54V32l-7-9a3 3 0 0 1 5-4l4 5V12a3 3 0 0 1 6 0v14V10a3 3 0 0 1 6 0v16V14a3 3 0 0 1 6 0v22c0 8-3 18-3 18z" /></>,
  jug: <><path d="M20 20h24v34H20z" /><path d="M26 20v-6h12v6" /><path d="M26 34h12" /></>,
  roll: <><ellipse cx="32" cy="22" rx="16" ry="7" /><path d="M16 22v22c0 4 7 7 16 7s16-3 16-7V22" /><ellipse cx="32" cy="22" rx="5" ry="2" /></>,
  generic: <><path d="M10 22l22-10 22 10v24L32 56 10 46z" /><path d="M10 22l22 10 22-10M32 32v24" /></>,
};

export function ProductArt({
  kind,
  imageUrl,
  alt,
  className,
  priority,
}: {
  kind: string;
  imageUrl?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  if (imageUrl) {
    return (
      <div className={cn("relative overflow-hidden bg-navy-50", className)}>
        <Image src={imageUrl} alt={alt} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" priority={priority} />
      </div>
    );
  }
  return (
    <div className={cn("flex items-center justify-center bg-gradient-to-br from-navy-50 to-white text-navy-700", className)} role="img" aria-label={`${alt} (illustration)`}>
      <svg viewBox="0 0 64 64" className="size-1/2 max-w-28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        {ART[kind] ?? ART.generic}
      </svg>
    </div>
  );
}
