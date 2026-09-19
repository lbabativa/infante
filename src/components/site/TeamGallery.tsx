"use client";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { PublicStaff } from "@/lib/public-types";
import { Portrait } from "./Portrait";

/**
 * Galería horizontal anclada: al hacer scroll vertical, el equipo desfila de lado.
 * En pantallas pequeñas se convierte en un carrusel táctil.
 */
export function TeamGallery({ team }: { team: PublicStaff[] }) {
  const ref = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const measure = () => setDistance(Math.max(0, (track.current?.scrollWidth ?? 0) - window.innerWidth + 40));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [team.length]);

  return (
    <>
      {/* Escritorio: scroll horizontal anclado */}
      <section ref={ref} id="equipo" className="relative hidden md:block" style={{ height: `calc(100vh + ${distance}px)` }}>
        <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
          <div className="mx-auto mb-10 flex w-full max-w-[1400px] items-end justify-between px-10">
            <div>
              <p className="eyebrow text-champagne">— El equipo</p>
              <h2 className="mt-3 font-display text-7xl leading-none lg:text-8xl">
                Manos de <em className="text-gold">autor</em>
              </h2>
            </div>
            <div className="w-64">
              <p className="mb-3 text-right text-sm text-sand">
                {team.length} especialistas · elige con quién quieres tu cita
              </p>
              <div className="h-px w-full bg-white/10">
                <motion.div style={{ width: bar }} className="h-px bg-champagne" />
              </div>
            </div>
          </div>
          <motion.div ref={track} style={{ x }} className="flex gap-6 pl-10 will-change-transform">
            {team.map((m, i) => (
              <TeamCard key={m.id} m={m} i={i} total={team.length} />
            ))}
            <Link
              href="/equipo"
              className="group flex w-[min(22rem,46vh)] shrink-0 flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/20 text-center transition-colors hover:border-champagne"
            >
              <span className="font-display text-5xl italic text-gold transition-transform duration-500 group-hover:scale-110">Conoce</span>
              <span className="font-display text-5xl">a todos</span>
              <span className="eyebrow mt-6 text-ivory/60">Ver equipo completo →</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Móvil */}
      <section className="py-24 md:hidden">
        <div className="px-5">
          <p className="eyebrow text-champagne">— El equipo</p>
          <h2 className="mt-3 font-display text-6xl leading-none">
            Manos de <em className="text-gold">autor</em>
          </h2>
        </div>
        <div className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4">
          {team.map((m, i) => (
            <TeamCard key={m.id} m={m} i={i} total={team.length} />
          ))}
        </div>
      </section>
    </>
  );
}

export function TeamCard({ m, i, total, compact = false }: { m: PublicStaff; i: number; total: number; compact?: boolean }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.9, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative shrink-0 snap-start overflow-hidden rounded-[2rem] bg-coal ${
        compact ? "w-full" : "w-[78vw] sm:w-[20rem] md:w-[min(22rem,46vh)]"
      } aspect-[3/4]`}
    >
      <Portrait name={m.name} photo={m.photo_url} index={i} />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
      <span className="eyebrow absolute left-6 top-6 text-ivory/70">
        {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
      {m.instagram && (
        <a
          href={`https://instagram.com/${m.instagram.replace("@", "")}`}
          target="_blank"
          rel="noreferrer"
          className="eyebrow absolute right-6 top-6 text-ivory/70 hover:text-gold"
        >
          IG ↗
        </a>
      )}
      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="eyebrow text-champagne">{m.role}</p>
        <h3 className="mt-2 font-display text-4xl leading-none">{m.name}</h3>
        <div className="grid grid-rows-[0fr] transition-all duration-700 ease-[var(--ease-silk)] group-hover:grid-rows-[1fr] max-md:grid-rows-[1fr]">
          <div className="overflow-hidden">
            {m.bio && <p className="mt-4 text-sm leading-relaxed text-ivory/70">{m.bio}</p>}
            {!!m.bookable && (
              <Link
                href={`/reservar?especialista=${m.id}`}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-ivory px-5 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-champagne"
              >
                Reservar con {m.name.split(" ")[0]} →
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
