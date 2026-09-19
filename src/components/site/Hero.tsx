"use client";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Strands } from "./Strands";
import { Magnetic } from "./Reveal";

const WORD = "INFANTE".split("");
const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const titleScale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative flex h-[100svh] min-h-[640px] flex-col overflow-hidden">
      {/* Atmósfera */}
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_70%_30%,#2a2119_0%,transparent_60%),radial-gradient(60%_50%_at_10%_90%,#1d1814_0%,transparent_70%)]" />
      <Strands className="absolute inset-[-5%] h-[110%] w-[110%]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink to-transparent" />

      <motion.div style={{ y: titleY, scale: titleScale, opacity: fade }} className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 text-center">
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.6em" }}
          animate={{ opacity: 1, letterSpacing: "0.32em" }}
          transition={{ duration: 1.6, delay: 0.3, ease: EASE }}
          className="eyebrow mb-6 text-champagne"
        >
          Alta peluquería · Bogotá
        </motion.p>

        <h1 className="sr-only">Infante Hair Stylist</h1>
        <div aria-hidden className="flex font-display text-[20vw] leading-[0.85] tracking-[-0.02em] md:text-[15vw]">
          {WORD.map((ch, i) => (
            <span key={i} className="overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "105%", rotate: 8 }}
                animate={{ y: 0, rotate: 0 }}
                transition={{ duration: 1.3, delay: 0.5 + i * 0.07, ease: EASE }}
              >
                {ch}
              </motion.span>
            </span>
          ))}
        </div>

        <div className="mt-4 overflow-hidden md:mt-2">
          <motion.p
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1.2, delay: 1.25, ease: EASE }}
            className="font-display text-2xl text-ivory/90 md:text-4xl"
          >
            Tu esencia, <em className="shine">nuestro arte</em>
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.7, ease: EASE }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Magnetic>
            <Link
              href="/reservar"
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-ivory px-8 py-4 text-sm font-semibold text-ink"
            >
              <span className="absolute inset-0 -translate-x-full bg-champagne transition-transform duration-700 ease-[var(--ease-silk)] group-hover:translate-x-0" />
              <span className="relative">Reservar mi cita</span>
              <span className="relative transition-transform duration-500 group-hover:translate-x-1">→</span>
            </Link>
          </Magnetic>
          <Link href="/servicios" className="text-sm text-ivory/70 underline decoration-champagne/50 underline-offset-8 transition hover:text-ivory">
            Ver servicios y precios
          </Link>
        </motion.div>
      </motion.div>

      {/* Sello giratorio */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 2, ease: EASE }}
        className="absolute bottom-24 right-6 z-10 hidden md:block lg:right-14"
      >
        <Link href="/reservar" className="group relative block h-32 w-32" aria-label="Reservar cita">
          <svg viewBox="0 0 100 100" className="h-full w-full animate-spin-slow">
            <defs>
              <path id="circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
            </defs>
            <text className="fill-ivory/80 font-mono text-[8.2px] uppercase tracking-[0.3em]">
              <textPath href="#circle">Reserva tu cita · Tu esencia ·</textPath>
            </text>
          </svg>
          <span className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-champagne text-ink transition-transform duration-500 group-hover:scale-125">
            ✦
          </span>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="relative z-10 mx-auto flex w-full max-w-[1400px] items-end justify-between px-5 pb-8 md:px-10"
      >
        <p className="eyebrow text-ivory/50">
          Calle 86A # 13A-09
          <br />
          Lun – Sáb · 6 am – 7 pm
        </p>
        <div className="flex flex-col items-center gap-2">
          <span className="eyebrow text-ivory/40">Scroll</span>
          <span className="relative h-12 w-px overflow-hidden bg-white/10">
            <motion.span
              className="absolute inset-x-0 top-0 h-1/2 bg-champagne"
              animate={{ y: ["-100%", "200%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
        </div>
        <p className="eyebrow hidden text-right text-ivory/50 md:block">
          Color · Corte
          <br />
          Tratamiento · Novias
        </p>
        <span className="md:hidden" />
      </motion.div>
    </section>
  );
}
