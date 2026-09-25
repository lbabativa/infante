import Link from "next/link";
import { clock, WEEKDAY_SHORT } from "@/lib/format";
import type { PublicLocation } from "@/lib/public-types";

const STEPS = [
  { t: "Elige", d: "Tu servicio o combinación: color, corte, tratamiento, uñas…" },
  { t: "Tu especialista", d: "Reserva con quien prefieras o déjanos asignarte al ideal." },
  { t: "Fecha y hora", d: "Solo ves horarios realmente disponibles, en tiempo real." },
  { t: "Listo", d: "Confirmación inmediata por WhatsApp y recordatorios antes de tu cita." },
];

export function Steps() {
  return (
    <section className="border-y border-white/10 bg-coal/40">
      <div className="mx-auto max-w-[1400px] px-5 py-20 md:px-10 md:py-24">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-champagne">— Reserva en línea 24/7</p>
            <h2 className="mt-3 font-display text-5xl leading-none md:text-6xl">
              Tu cita, <em className="text-gold">en un minuto</em>
            </h2>
            <p className="mt-4 max-w-md text-sand">
              Sin llamadas ni esperas. Si algo cambia, gestionas o cancelas tu cita desde el enlace que te llega por WhatsApp.
            </p>
          </div>
          <Link
            href="/reservar"
            className="self-start rounded-full bg-champagne px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-gold md:self-auto"
          >
            Reservar ahora →
          </Link>
        </div>
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.t} className="rounded-3xl border border-white/10 bg-ink p-6">
              <span className="font-display text-4xl leading-none text-gold">{i + 1}</span>
              <h3 className="mt-4 font-display text-2xl">{s.t}</h3>
              <p className="mt-2 text-sm text-ivory/60">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Locations({ locations }: { locations: PublicLocation[] }) {
  return (
    <section id="sedes" className="relative mx-auto max-w-[1400px] scroll-mt-24 px-5 py-20 md:px-10 md:py-28">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <h2 className="font-display text-5xl leading-none md:text-6xl">
          Nuestras <em className="text-gold">sedes</em>
        </h2>
        <p className="max-w-sm text-sand">La casa Infante crece. Pronto, más espacios para vivir la experiencia.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {locations.map((l, i) =>
          l.coming_soon && !l.active ? (
            <div key={l.id} className="flex min-h-[16rem] flex-col justify-between rounded-[2rem] border border-white/10 p-8 md:p-10">
              <p className="eyebrow text-champagne">Próximamente</p>
              <div>
                <h3 className="font-display text-4xl italic">{l.name}</h3>
                <p className="mt-3 text-ivory/60">{l.address}</p>
              </div>
            </div>
          ) : (
            <div key={l.id} className="flex flex-col justify-between gap-8 rounded-[2rem] bg-ivory p-8 text-ink md:p-10">
              <div className="flex items-start justify-between">
                <p className="eyebrow text-ink/60">Sede {String(i + 1).padStart(2, "0")}</p>
                <span className="flex items-center gap-2 text-xs font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" /> Abierto L – S
                </span>
              </div>
              <div>
                <h3 className="font-display text-4xl">{l.name}</h3>
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
          )
        )}
      </div>
    </section>
  );
}
