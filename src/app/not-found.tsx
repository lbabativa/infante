import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink px-5 text-center text-ivory">
      <p className="eyebrow text-champagne">404</p>
      <h1 className="mt-4 font-display text-6xl">
        Esta página <em className="text-gold">no existe</em>
      </h1>
      <Link href="/" className="mt-10 rounded-full border border-champagne px-6 py-3 text-sm hover:bg-champagne hover:text-ink">
        Volver al inicio
      </Link>
    </div>
  );
}
