import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex flex-col items-center leading-none ${className}`} aria-label="Infante Hair Stylist — inicio">
      <span className="font-display text-[1.35rem] tracking-[0.32em] pl-[0.32em] transition-colors group-hover:text-gold">INFANTE</span>
      <span className="font-display italic text-[0.62rem] tracking-[0.2em] text-sand mt-1">Hair Stylist</span>
    </Link>
  );
}
