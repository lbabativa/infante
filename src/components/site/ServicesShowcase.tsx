"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { duration, priceLabel } from "@/lib/format";
import type { PublicCategory } from "@/lib/public-types";
import { MaskText } from "./Reveal";

/** El menú: categorías a la izquierda, servicios que se revelan a la derecha. */
export function ServicesShowcase({ categories, limit = 6 }: { categories: PublicCategory[]; limit?: number }) {
  const [active, setActive] = useState(0);
  const cat = categories[active];

  return (
    <section id="servicios" className="relative mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-36">
      <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <h2 className="font-display text-6xl leading-[0.95] md:text-8xl">
          <MaskText lines={["El menú", <em key="i" className="text-gold">de la casa</em>]} />
        </h2>
        <p className="max-w-sm text-sand">
          Trabajamos con Kérastase, Wella, Alfaparf, Truss y Authentic Beauty Concept. Precios de referencia; tu estilista confirma el valor
          final en el diagnóstico.
        </p>
      </div>

      <div className="grid gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] md:gap-16">
        {/* Categorías */}
        <ul className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:block md:space-y-1 md:px-0">
          {categories.map((c, i) => (
            <li key={c.id} className="shrink-0">
              <button
                onClick={() => setActive(i)}
                onMouseEnter={() => window.matchMedia("(hover: hover)").matches && setActive(i)}
                className={`group relative flex w-full items-baseline gap-4 rounded-full border px-4 py-2 text-left transition-colors md:rounded-none md:border-0 md:border-b md:border-white/10 md:px-0 md:py-4 ${
                  i === active ? "border-champagne text-ivory" : "border-white/15 text-ivory/45 hover:text-ivory/80"
                }`}
              >
                <span className="eyebrow hidden w-8 md:inline">{String(i + 1).padStart(2, "0")}</span>
                <span className="whitespace-nowrap text-sm md:font-display md:text-4xl">{c.name}</span>
                {i === active && (
                  <motion.span layoutId="cat-dot" className="ml-auto hidden h-2 w-2 rounded-full bg-champagne md:block" />
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Servicios */}
        <div className="relative min-h-[28rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="mb-8 font-display text-2xl italic text-sand">{cat.tagline}</p>
              <ul>
                {cat.services.slice(0, limit).map((s, i) => (
                  <motion.li
                    key={s.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, duration: 0.5 }}
                  >
                    <Link
                      href={`/reservar?servicio=${s.id}`}
                      className="group flex items-start gap-4 border-b border-white/10 py-5 transition-colors hover:border-champagne/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-3 text-lg font-medium md:text-xl">
                          {s.name}
                          {!!s.featured && <span className="eyebrow rounded-full border border-champagne/50 px-2 py-0.5 text-[0.55rem] text-champagne">Firma</span>}
                        </p>
                        {s.description && <p className="mt-1 line-clamp-2 max-w-xl text-sm text-ivory/50">{s.description}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-display text-xl text-gold">{priceLabel(s.price, s.price_from)}</p>
                        <p className="eyebrow mt-1 text-ivory/40">{duration(s.duration_min)}</p>
                      </div>
                      <span className="mt-1 hidden -translate-x-2 text-champagne opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 md:block">
                        →
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
              {cat.services.length > limit && (
                <Link href={`/servicios#${cat.slug}`} className="eyebrow mt-6 inline-block text-champagne hover:text-gold">
                  Ver los {cat.services.length} servicios de {cat.name} →
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
