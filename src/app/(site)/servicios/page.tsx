import type { Metadata } from "next";
import Link from "next/link";
import { duration, priceLabel } from "@/lib/format";
import { publicCatalog } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Servicios y precios",
  description: "Color, balayage, cortes de autor, tratamientos Kérastase, Wella, Alfaparf y Truss, keratina, maquillaje, novias, manicure y más.",
};

export default async function ServiciosPage() {
  const categories = await publicCatalog();
  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-24 pt-32 md:px-10">
      <p className="eyebrow text-champagne">— Carta de servicios</p>
      <h1 className="mt-4 font-display text-6xl leading-[0.95] md:text-7xl">
        Servicios <em className="text-gold">&amp; precios</em>
      </h1>
      <p className="mt-8 max-w-xl text-sand">
        Precios de referencia en pesos colombianos. Los servicios marcados “desde” dependen del largo y la densidad del cabello: tu estilista
        confirma el valor en el diagnóstico. La asesoría y valoración no tiene costo.
      </p>

      <nav className="no-scrollbar sticky top-20 z-20 -mx-5 mt-14 flex gap-2 overflow-x-auto bg-ink/80 px-5 py-4 backdrop-blur-xl md:mx-0 md:px-0">
        {categories.map((c) => (
          <a key={c.id} href={`#${c.slug}`} className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-xs text-ivory/70 hover:border-champagne hover:text-ivory">
            {c.name}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-24">
        {categories.map((c, ci) => (
          <section key={c.id} id={c.slug} className="grid scroll-mt-40 gap-8 md:grid-cols-[1fr_2fr]">
              <div className="md:sticky md:top-44">
                <span className="eyebrow text-champagne">{String(ci + 1).padStart(2, "0")}</span>
                <h2 className="mt-2 font-display text-5xl md:text-6xl">{c.name}</h2>
                <p className="mt-3 max-w-xs font-display text-lg italic text-sand">{c.tagline}</p>
              </div>
            <ul>
              {c.services.map((s) => (
                  <li key={s.id} className="flex flex-col gap-3 border-b border-white/10 py-6 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl">
                        {s.name}
                        {!!s.featured && <span className="eyebrow ml-3 rounded-full border border-champagne/50 px-2 py-0.5 align-middle text-[0.55rem] text-champagne">Firma</span>}
                      </h3>
                      {s.description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-ivory/50">{s.description}</p>}
                    </div>
                    <div className="flex items-center gap-6 sm:flex-col sm:items-end sm:gap-1">
                      <p className="font-display text-2xl text-gold">{priceLabel(s.price, s.price_from)}</p>
                      <p className="eyebrow text-ivory/40">{duration(s.duration_min)}</p>
                      <Link
                        href={`/reservar?servicio=${s.id}`}
                        className="ml-auto rounded-full border border-white/15 px-4 py-1.5 text-xs transition hover:border-champagne hover:bg-champagne hover:text-ink sm:ml-0 sm:mt-3"
                      >
                        Reservar
                      </Link>
                    </div>
                  </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
