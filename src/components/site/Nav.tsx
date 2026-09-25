"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/equipo", label: "Equipo" },
  { href: "/servicios", label: "Servicios" },
  { href: "/#sedes", label: "Sedes" },
  { href: "/unete", label: "Únete" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between gap-8 px-5 md:px-10">
        <Logo />
        <nav className="hidden flex-1 items-center justify-end gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-[0.85rem] transition-colors hover:text-ivory ${pathname === l.href ? "text-gold" : "text-ivory/75"}`}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/reservar" className="rounded-full bg-champagne px-5 py-2.5 text-[0.85rem] font-semibold text-ink transition-colors hover:bg-gold">
            Reservar cita
          </Link>
        </nav>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 items-center rounded-full border border-white/15 px-4 text-sm md:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
        >
          {open ? "Cerrar" : "Menú"}
        </button>
      </div>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-20 z-40 flex flex-col gap-2 bg-ink px-6 pb-10 pt-8 md:hidden">
          {[{ href: "/", label: "Inicio" }, ...LINKS].map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-white/10 py-4 font-display text-3xl">
              {l.label}
            </Link>
          ))}
          <Link
            href="/reservar"
            onClick={() => setOpen(false)}
            className="mt-6 rounded-full bg-champagne px-6 py-4 text-center text-sm font-semibold text-ink"
          >
            Reservar cita
          </Link>
          <p className="eyebrow mt-auto text-sand">Calle 86A # 13A-09 · Bogotá</p>
        </div>
      )}
    </header>
  );
}
