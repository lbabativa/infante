import Link from "next/link";
import { clock, WEEKDAY_SHORT } from "@/lib/format";
import type { PublicLocation } from "@/lib/public-types";
import { MaskText, Magnetic, Reveal } from "./Reveal";

const BRANDS = ["Kérastase", "Wella Professionals", "Alfaparf Milano", "Truss", "Authentic Beauty Concept"];

export function Brands() {
  return (
    <section className="border-y border-white/10 py-14">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-14 gap-y-6 px-5 md:justify-between md:px-10">
        <p className="eyebrow w-full text-center text-ivory/40 md:w-auto md:text-left">Trabajamos con</p>
        {BRANDS.map((b, i) => (
          <Reveal key={b} delay={i * 0.08} y={16}>
            <span className={`text-xl text-ivory/70 md:text-2xl ${i % 2 ? "font-display italic" : "font-mono uppercase tracking-[0.2em] text-base md:text-lg"}`}>
              {b}
            </span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { t: "Elige", d: "Tu servicio o combinación: color, corte, tratamiento, uñas…" },
  { t: "Tu especialista", d: "Reserva con quien prefieras o déjanos asignarte al ideal." },
  { t: "Fecha y hora", d: "Solo ves horarios realmente disponibles, en tiempo real." },
  { t: "Listo", d: "Confirmación inmediata por WhatsApp y recordatorios antes de tu cita." },
];

export function Steps() {
  return (
    <section className="relative mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-36">
      <div className="grid gap-16 md:grid-cols-[1fr_1.4fr]">
        <div className="md:sticky md:top-32 md:self-start">
          <p className="eyebrow text-champagne">— Reserva en línea 24/7</p>
          <h2 className="mt-4 font-display text-5xl leading-[1] md:text-7xl">
            <MaskText lines={["Tu cita,", <em key="e" className="text-gold">en un minuto.</em>]} />
          </h2>
          <p className="mt-6 max-w-sm text-sand">
            Sin llamadas ni esperas. Y si algo cambia, gestionas o cancelas tu cita desde el enlace que te llega por WhatsApp.
          </p>
          <Link
            href="/reservar"
            className="mt-10 inline-flex items-center gap-3 rounded-full border border-champagne px-7 py-3.5 text-sm transition-colors hover:bg-champagne hover:text-ink"
          >
            Empezar reserva →
          </Link>
        </div>
        <ol className="space-y-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.1}>
              <li className="group flex gap-8 rounded-3xl border border-white/10 bg-coal/60 p-8 transition-colors duration-500 hover:border-champagne/50 hover:bg-coal">
                <span className="font-display text-6xl leading-none text-outline transition-colors duration-500 group-hover:text-gold">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display text-3xl">{s.t}</h3>
                  <p className="mt-2 text-ivory/60">{s.d}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Locations({ locations }: { locations: PublicLocation[] }) {
  return (
    <section id="sedes" className="relative mx-auto max-w-[1400px] scroll-mt-24 px-5 py-28 md:px-10">
      <div className="mb-14 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <h2 className="font-display text-6xl leading-none md:text-8xl">
          <MaskText lines={["Nuestras", <em key="s" className="text-gold">sedes</em>]} />
        </h2>
        <p className="max-w-sm text-sand">La casa Infante crece. Pronto, más espacios para vivir la experiencia.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {locations.map((l, i) => (
          <Reveal key={l.id} delay={i * 0.12}>
            {l.coming_soon && !l.active ? (
              <div className="relative flex h-full min-h-[22rem] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 p-8 md:p-10">
                <div className="absolute -right-24 -top-24 h-72 w-72 animate-spin-slow rounded-full bg-[conic-gradient(from_0deg,transparent,#c9a87755,transparent_40%)] blur-2xl" />
                <p className="eyebrow text-champagne">Próximamente</p>
                <div>
                  <h3 className="font-display text-5xl italic">{l.name}</h3>
                  <p className="mt-3 text-ivory/60">{l.address}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[22rem] flex-col justify-between rounded-[2rem] bg-ivory p-8 text-ink md:p-10">
                <div className="flex items-start justify-between">
                  <p className="eyebrow text-ink/60">Sede {String(i + 1).padStart(2, "0")}</p>
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" /> Abierto L – S
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-5xl">{l.name}</h3>
                  <p className="mt-2 text-ink/70">
                    {l.address} · {l.city}
                  </p>
                  <dl className="mt-6 grid grid-cols-7 gap-1 text-center text-xs">
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                      <div key={d} className={`rounded-lg py-2 ${l.hours[d] ? "bg-ink/5" : "bg-ink/[0.02] text-ink/30"}`}>
                        <dt className="font-semibold">{WEEKDAY_SHORT[d]}</dt>
                        <dd className="mt-1 text-[0.62rem] leading-tight">
                          {l.hours[d] ? (
                            <>
                              {clock(l.hours[d]![0]).replace(" a. m.", "a")}
                              <br />
                              {clock(l.hours[d]![1]).replace(" p. m.", "p")}
                            </>
                          ) : (
                            "Cerrado"
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={`/reservar?sede=${l.id}`} className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-ivory hover:bg-smoke">
                      Reservar aquí
                    </Link>
                    {l.maps_url && (
                      <a href={l.maps_url} target="_blank" rel="noreferrer" className="rounded-full border border-ink/20 px-5 py-2.5 text-sm hover:border-ink">
                        Cómo llegar ↗
                      </a>
                    )}
                    {l.whatsapp && (
                      <a href={`https://wa.me/${l.whatsapp}`} target="_blank" rel="noreferrer" className="rounded-full border border-ink/20 px-5 py-2.5 text-sm hover:border-ink">
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden px-5 py-36 text-center md:py-48">
      <div className="absolute left-1/2 top-1/2 h-[60vw] w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#c9a87733,transparent_65%)]" />
      <p className="eyebrow relative text-champagne">Tu próxima versión empieza aquí</p>
      <h2 className="relative mt-6 font-display text-[13vw] leading-[0.9] md:text-[9vw]">
        <MaskText lines={["Reserva", <em key="t" className="text-gold">tu momento</em>]} />
      </h2>
      <div className="relative mt-12">
        <Magnetic strength={0.5}>
          <Link
            href="/reservar"
            className="inline-flex h-36 w-36 items-center justify-center rounded-full bg-champagne text-sm font-semibold text-ink transition-transform duration-500 hover:scale-110 md:h-44 md:w-44"
          >
            Reservar →
          </Link>
        </Magnetic>
      </div>
    </section>
  );
}
