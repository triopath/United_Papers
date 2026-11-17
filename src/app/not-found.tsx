import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid flex-1 place-items-center px-4 py-24 text-center">
      <div>
        <p className="font-heading text-6xl font-extrabold text-navy-700">404</p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-navy-900">We couldn&apos;t find that page</h1>
        <p className="mt-2 text-slate-600">The product or page may have moved.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-lg bg-navy-700 px-5 font-semibold text-white hover:bg-navy-900">Back to United Papers</Link>
      </div>
    </div>
  );
}
