"use client";
import Link from "next/link";
import { useState } from "react";
import { duration, priceLabel } from "@/lib/format";
import type { PublicCategory } from "@/lib/public-types";

/** El menú: categorías a la izquierda, servicios de la categoría elegida a la derecha. */
export function ServicesShowcase({ categories, limit = 6 }: { categories: PublicCategory[]; limit?: number }) {
  const [active, setActive] = useState(0);
  const cat = categories[active];

  return (
    <section id="servicios" className="relative mx-auto max-w-[1400px] scroll-mt-24 px-5 py-20 md:px-10 md:py-28">
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <h2 className="font-display text-5xl leading-[0.95] md:text-6xl">
          Servicios y <em className="text-gold">precios</em>
        </h2>
        <p className="max-w-sm text-sand">
          Trabajamos con Kérastase, Wella, Alfaparf, Truss y Authentic Beauty Concept. Precios de referencia; tu estilista confirma el valor
          final en el diagnóstico.
        </p>
      </div>

      <div className="grid gap-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] md:gap-16">
        {/* Categorías */}
        <ul className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:block md:space-y-1 md:px-0">
          {categories.map((c, i) => (
            <li key={c.id} className="shrink-0">
              <button
                onClick={() => setActive(i)}
                className={`flex w-full items-baseline gap-4 rounded-full border px-4 py-2 text-left transition-colors md:rounded-none md:border-0 md:border-b md:border-white/10 md:px-0 md:py-3 ${
                  i === active ? "border-champagne text-ivory md:text-gold" : "border-white/15 text-ivory/50 hover:text-ivory/80"
                }`}
              >
                <span className="whitespace-nowrap text-sm md:font-display md:text-2xl">{c.name}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Servicios */}
        {cat && (
          <div>
            {cat.tagline && <p className="mb-6 font-display text-xl italic text-sand">{cat.tagline}</p>}
            <ul>
              {cat.services.slice(0, limit).map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/reservar?servicio=${s.id}`}
                    className="flex items-start gap-4 border-b border-white/10 py-5 transition-colors hover:border-champagne/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-3 text-lg font-medium">
                        {s.name}
                        {!!s.featured && <span className="eyebrow rounded-full border border-champagne/50 px-2 py-0.5 text-[0.55rem] text-champagne">Firma</span>}
                      </p>
                      {s.description && <p className="mt-1 line-clamp-2 max-w-xl text-sm text-ivory/50">{s.description}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-xl text-gold">{priceLabel(s.price, s.price_from)}</p>
                      <p className="eyebrow mt-1 text-ivory/40">{duration(s.duration_min)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={`/servicios#${cat.slug}`} className="eyebrow mt-6 inline-block text-champagne hover:text-gold">
              {cat.services.length > limit ? `Ver los ${cat.services.length} servicios de ${cat.name} →` : "Ver todos los servicios →"}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
