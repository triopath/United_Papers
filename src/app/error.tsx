"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid flex-1 place-items-center px-4 py-24 text-center">
      <div>
        <h1 className="font-heading text-2xl font-bold text-navy-900">Something went wrong</h1>
        <p className="mt-2 max-w-md text-slate-600">We couldn&apos;t load this page. If the problem continues, check that the database is running.</p>
        <button type="button" onClick={reset} className="mt-6 inline-flex h-11 items-center rounded-lg bg-navy-700 px-5 font-semibold text-white hover:bg-navy-900">Try again</button>
      </div>
    </div>
  );
}
