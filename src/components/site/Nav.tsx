"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/servicios", label: "Servicios" },
  { href: "/equipo", label: "Equipo" },
  { href: "/#sedes", label: "Sedes" },
  { href: "/unete", label: "Únete" },
];

export function Nav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 40);
    setHidden(y > 400 && y > prev && !open);
  });
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <motion.header
        animate={{ y: hidden ? -100 : 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          scrolled && !open ? "border-b border-white/5 bg-ink/70 backdrop-blur-xl" : ""
        }`}
      >
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-5 md:px-10">
          <nav className="hidden flex-1 gap-8 md:flex">
            {LINKS.slice(0, 2).map((l) => (
              <NavLink key={l.href} {...l} active={pathname === l.href} />
            ))}
          </nav>
          <Logo />
          <div className="hidden flex-1 items-center justify-end gap-8 md:flex">
            {LINKS.slice(2).map((l) => (
              <NavLink key={l.href} {...l} active={pathname === l.href} />
            ))}
            <Link
              href="/reservar"
              className="group relative overflow-hidden rounded-full border border-champagne/60 px-5 py-2.5 text-[0.8rem] font-medium tracking-wide"
            >
              <span className="absolute inset-0 translate-y-full bg-champagne transition-transform duration-500 ease-[var(--ease-silk)] group-hover:translate-y-0" />
              <span className="relative transition-colors duration-500 group-hover:text-ink">Reservar cita</span>
            </Link>
          </div>
          <button
            onClick={() => setOpen((o) => !o)}
            className="relative z-50 flex h-10 w-10 flex-col items-end justify-center gap-1.5 md:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
          >
            <motion.span animate={open ? { rotate: 45, y: 4, width: 26 } : { rotate: 0, y: 0, width: 26 }} className="block h-px bg-ivory" />
            <motion.span animate={open ? { rotate: -45, y: -3, width: 26 } : { rotate: 0, y: 0, width: 16 }} className="block h-px bg-ivory" />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col justify-between bg-ink px-6 pb-10 pt-28 md:hidden"
            initial={{ clipPath: "circle(0% at 92% 5%)" }}
            animate={{ clipPath: "circle(150% at 92% 5%)" }}
            exit={{ clipPath: "circle(0% at 92% 5%)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <ul className="space-y-2">
              {[{ href: "/", label: "Inicio" }, ...LINKS, { href: "/reservar", label: "Reservar" }].map((l, i) => (
                <li key={l.href} className="overflow-hidden">
                  <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                    <Link href={l.href} onClick={() => setOpen(false)} className="flex items-baseline gap-4 font-display text-5xl">
                      <span className="eyebrow text-champagne">0{i + 1}</span>
                      {l.label}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
            <p className="eyebrow text-sand">Calle 86A # 13A-09 · Bogotá</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className="group relative text-[0.82rem] tracking-wide text-ivory/80 transition-colors hover:text-ivory">
      {label}
      <span
        className={`absolute -bottom-1 left-0 h-px bg-champagne transition-all duration-500 ease-[var(--ease-silk)] ${
          active ? "w-full" : "w-0 group-hover:w-full"
        }`}
      />
    </Link>
  );
}
