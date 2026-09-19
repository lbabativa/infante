import type { Metadata } from "next";
import Link from "next/link";
import { MaskText } from "@/components/site/Reveal";
import { TeamCard } from "@/components/site/TeamGallery";
import { publicTeam } from "@/lib/public-data";

export const metadata: Metadata = { title: "Nuestro equipo", description: "Conoce a los estilistas y especialistas de Infante Hair Stylist." };

export default function EquipoPage() {
  const team = publicTeam();
  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-32 pt-40 md:px-10">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <p className="eyebrow text-champagne">— {team.length} especialistas</p>
          <h1 className="mt-4 font-display text-[16vw] leading-[0.85] md:text-[9rem]">
            <MaskText lines={["El equipo", <em key="a" className="text-gold">Infante</em>]} />
          </h1>
        </div>
        <p className="max-w-sm text-sand">
          Una familia de estilistas y especialistas que comparten oficio, técnica y la obsesión por el detalle. Elige con quién quieres tu cita.
        </p>
      </div>
      <div className="mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {team.map((m, i) => (
          <div key={m.id} className={i % 4 === 1 || i % 4 === 3 ? "xl:translate-y-16" : ""}>
            <TeamCard m={m} i={i} total={team.length} compact />
          </div>
        ))}
      </div>
      <div className="mt-40 flex flex-col items-center gap-6 text-center">
        <p className="font-display text-4xl md:text-6xl">
          ¿Quieres ser parte de la <em className="text-gold">casa</em>?
        </p>
        <Link href="/unete" className="rounded-full border border-champagne px-7 py-3.5 text-sm hover:bg-champagne hover:text-ink">
          Únete a nuestro equipo →
        </Link>
      </div>
    </div>
  );
}
