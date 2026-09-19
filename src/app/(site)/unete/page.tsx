import type { Metadata } from "next";
import { MaskText } from "@/components/site/Reveal";
import { ApplyForm } from "./ApplyForm";

export const metadata: Metadata = { title: "Únete a nuestro equipo", description: "Trabaja con Infante Hair Stylist. Estamos creciendo y abriendo nuevas sedes." };

export default function UnetePage() {
  return (
    <div className="mx-auto grid max-w-[1400px] gap-16 px-5 pb-32 pt-40 md:px-10 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <p className="eyebrow text-champagne">— Trabaja con nosotros</p>
        <h1 className="mt-4 font-display text-[15vw] leading-[0.85] md:text-8xl">
          <MaskText lines={["Únete a", <em key="c" className="text-gold">la casa</em>]} />
        </h1>
        <p className="mt-8 max-w-md text-sand">
          Estamos creciendo y abriendo nuevas sedes. Buscamos talento con técnica, sensibilidad y ganas de seguir aprendiendo junto a la
          familia Infante.
        </p>
        <ul className="mt-10 space-y-4 text-ivory/70">
          {["Formación continua con marcas profesionales", "Agenda digital: tus citas organizadas desde el primer día", "Un equipo que celebra el oficio"].map((t) => (
            <li key={t} className="flex gap-3">
              <span className="text-champagne">✦</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
      <ApplyForm />
    </div>
  );
}
