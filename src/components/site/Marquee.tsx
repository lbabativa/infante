"use client";
import { motion, useScroll, useTransform } from "motion/react";

const WORDS = ["Balayage", "Corte de autor", "Kérastase", "Novias", "Color", "Tratamientos", "Blower", "Keratina", "Contorno"];

/** Doble cinta de texto que avanza en sentidos opuestos al hacer scroll. */
export function Marquee() {
  const { scrollYProgress } = useScroll();
  const x1 = useTransform(scrollYProgress, [0, 1], ["0%", "-35%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["-35%", "0%"]);
  const row = [...WORDS, ...WORDS];
  return (
    <section aria-hidden className="relative select-none overflow-hidden border-y border-white/10 py-8 md:py-12">
      <motion.div style={{ x: x1 }} className="flex whitespace-nowrap font-display text-6xl md:text-8xl">
        {row.map((w, i) => (
          <span key={i} className="mx-6 flex items-center gap-12">
            <span className={i % 2 ? "text-outline italic" : ""}>{w}</span>
            <span className="text-3xl text-champagne">✦</span>
          </span>
        ))}
      </motion.div>
      <motion.div style={{ x: x2 }} className="mt-4 flex whitespace-nowrap font-mono text-sm uppercase tracking-[0.4em] text-sand">
        {[...row, ...row].map((w, i) => (
          <span key={i} className="mx-8">
            {w}
          </span>
        ))}
      </motion.div>
    </section>
  );
}
