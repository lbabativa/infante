import Link from "next/link";
import type { PublicStaff } from "@/lib/public-types";
import { Portrait } from "./Portrait";

/** Vista previa del equipo en la home: cuadrícula simple con enlace al equipo completo. */
export function TeamGallery({ team, limit = 8 }: { team: PublicStaff[]; limit?: number }) {
  return (
    <section id="equipo" className="mx-auto max-w-[1400px] scroll-mt-24 px-5 py-20 md:px-10 md:py-28">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="eyebrow text-champagne">— El equipo</p>
          <h2 className="mt-3 font-display text-5xl leading-none md:text-6xl">
            Conoce a nuestros <em className="text-gold">especialistas</em>
          </h2>
        </div>
        <p className="max-w-sm text-sand">{team.length} especialistas · elige con quién quieres tu cita.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {team.slice(0, limit).map((m, i) => (
          <TeamCard key={m.id} m={m} i={i} />
        ))}
      </div>
      {team.length > limit && (
        <div className="mt-10 text-center">
          <Link href="/equipo" className="rounded-full border border-champagne px-7 py-3.5 text-sm transition-colors hover:bg-champagne hover:text-ink">
            Ver equipo completo →
          </Link>
        </div>
      )}
    </section>
  );
}

export function TeamCard({ m, i }: { m: PublicStaff; i: number }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-coal">
      <div className="aspect-[4/5] overflow-hidden">
        <Portrait name={m.name} photo={m.photo_url} index={i} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow text-champagne">{m.role}</p>
        <h3 className="mt-2 font-display text-3xl leading-none">{m.name}</h3>
        {m.bio && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ivory/70">{m.bio}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
          {!!m.bookable && (
            <Link
              href={`/reservar?especialista=${m.id}`}
              className="rounded-full bg-ivory px-5 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-champagne"
            >
              Reservar con {m.name.split(" ")[0]}
            </Link>
          )}
          {m.instagram && (
            <a
              href={`https://instagram.com/${m.instagram.replace("@", "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-ivory/60 hover:text-gold"
            >
              Instagram ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
