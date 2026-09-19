import Link from "next/link";
import { Logo } from "./Logo";

export function Footer({ whatsapp, instagram }: { whatsapp: string; instagram: string }) {
  return (
    <footer className="relative border-t border-white/10 bg-ink">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 md:grid-cols-4 md:px-10">
        <div className="space-y-4">
          <Logo className="!items-start" />
          <p className="max-w-xs font-display text-lg italic text-sand">Tu esencia, nuestro arte.</p>
        </div>
        <div className="space-y-3 text-sm text-ivory/70">
          <p className="eyebrow text-champagne">Visítanos</p>
          <p>
            Calle 86A # 13A-09, Local 102
            <br />
            Bogotá D.C.
          </p>
          <p>
            Lunes a sábado · 6:00 a. m. – 7:00 p. m.
            <br />
            Domingo · cerrado
          </p>
        </div>
        <div className="space-y-3 text-sm text-ivory/70">
          <p className="eyebrow text-champagne">Explora</p>
          <ul className="space-y-2">
            <li><Link className="hover:text-ivory" href="/reservar">Reservar cita</Link></li>
            <li><Link className="hover:text-ivory" href="/servicios">Servicios y precios</Link></li>
            <li><Link className="hover:text-ivory" href="/equipo">Nuestro equipo</Link></li>
            <li><Link className="hover:text-ivory" href="/unete">Trabaja con nosotros</Link></li>
          </ul>
        </div>
        <div className="space-y-3 text-sm text-ivory/70">
          <p className="eyebrow text-champagne">Conversemos</p>
          <ul className="space-y-2">
            <li><a className="hover:text-ivory" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a></li>
            <li><a className="hover:text-ivory" href={instagram} target="_blank" rel="noreferrer">Instagram @infantehairstylist</a></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-2 border-t border-white/5 px-5 py-6 text-xs text-ivory/40 md:flex-row md:px-10">
        <p>© {new Date().getFullYear()} Infante Hair Stylist</p>
        <p>
          Diseñado y desarrollado por <span className="text-ivory/70">StartIA</span>
        </p>
      </div>
    </footer>
  );
}
