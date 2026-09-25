import Link from "next/link";

const delay = (s: number) => ({ animationDelay: `${s}s` });

export function Hero() {
  return (
    <section className="relative flex min-h-[80svh] flex-col items-center justify-center px-5 pb-16 pt-32 text-center">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_70%_30%,#2a2119_0%,transparent_60%)]" />
      <p className="fade-up eyebrow mb-6 text-champagne">Alta peluquería · Bogotá</p>
      <h1 className="fade-up font-display text-6xl leading-[0.95] md:text-8xl" style={delay(0.1)}>
        Infante Hair Stylist
      </h1>
      <p className="fade-up mt-6 max-w-xl text-lg text-ivory/80 md:text-xl" style={delay(0.25)}>
        Tu esencia, <em className="text-gold">nuestro arte</em>. Color, corte, tratamientos y novias con un equipo de especialistas.
      </p>

      <div className="fade-up mt-10 flex flex-col items-center gap-4 sm:flex-row" style={delay(0.4)}>
        <Link href="/reservar" className="rounded-full bg-ivory px-8 py-4 text-sm font-semibold text-ink transition-colors hover:bg-champagne">
          Reservar mi cita →
        </Link>
        <Link href="/equipo" className="rounded-full border border-white/20 px-8 py-4 text-sm transition-colors hover:border-champagne">
          Conocer al equipo
        </Link>
      </div>

      <p className="fade-up mt-12 text-sm text-ivory/50" style={delay(0.55)}>
        Calle 86A # 13A-09 · Lun – Sáb · 6 am – 7 pm
      </p>
    </section>
  );
}
