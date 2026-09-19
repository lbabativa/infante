"use client";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { Counter, Reveal } from "./Reveal";

const TEXT =
  "Creemos que el cabello es la firma de quien eres. Por eso no seguimos fórmulas: escuchamos, diagnosticamos y diseñamos cada color, cada corte y cada ritual a la medida de tu esencia.";

export function Manifesto({ team, services }: { team: number; services: number }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = TEXT.split(" ");

  return (
    <section className="relative mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-40">
      <div className="grid gap-16 md:grid-cols-[1fr_2.2fr]">
        <Reveal>
          <p className="eyebrow text-champagne">— La casa Infante</p>
          <p className="mt-4 max-w-[16rem] text-sm leading-relaxed text-sand">
            Una familia de estilistas que convirtió el oficio en arte. Hoy, un equipo que crece y abre nuevas sedes.
          </p>
        </Reveal>
        <p ref={ref} className="font-display text-3xl leading-[1.2] md:text-5xl md:leading-[1.15]">
          {words.map((w, i) => (
            <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
              {w}
            </Word>
          ))}
        </p>
      </div>

      <div className="mt-24 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-4">
        {[
          { n: team, s: "", label: "Especialistas" },
          { n: services, s: "+", label: "Servicios de autor" },
          { n: 6, s: "", label: "Días a la semana" },
          { n: 5, s: "", label: "Marcas profesionales" },
        ].map((st, i) => (
          <Reveal key={st.label} delay={i * 0.1} className="bg-ink p-6 md:p-10">
            <p className="font-display text-5xl text-gold md:text-7xl">
              <Counter to={st.n} suffix={st.s} />
            </p>
            <p className="eyebrow mt-3 text-ivory/60">{st.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  const italic = ["firma", "arte", "esencia."].includes(children);
  return (
    <motion.span style={{ opacity }} className={`mr-[0.25em] inline-block ${italic ? "italic text-gold" : ""}`}>
      {children}
    </motion.span>
  );
}
