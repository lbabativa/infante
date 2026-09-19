import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setBookingStatus } from "@/lib/bookings";
import { bogotaNow, clock, duration, longDate, priceLabel } from "@/lib/format";
import { getBookingByCode, STATUS_LABEL } from "@/lib/repo";
import { getSetting } from "@/lib/db";

export const metadata: Metadata = { title: "Mi cita", robots: { index: false } };

export default async function MiCitaPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const b = getBookingByCode(code);
  if (!b) notFound();

  const now = bogotaNow();
  const upcoming = b.date > now.date || (b.date === now.date && b.start_min > now.minutes);
  const cancellable = upcoming && ["pending", "confirmed"].includes(b.status);
  const whatsapp = getSetting("salon_whatsapp");

  async function cancel() {
    "use server";
    const current = getBookingByCode(code);
    if (current && ["pending", "confirmed"].includes(current.status)) await setBookingStatus(current.id, "cancelled");
    revalidatePath(`/reserva/${code}`);
  }

  const reschedule = `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola, quiero reprogramar mi cita ${b.code} del ${longDate(b.date)} a las ${clock(b.start_min)}.`)}`;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-32 pt-36">
      <p className="eyebrow text-champagne">Mi cita · {b.code}</p>
      <h1 className="mt-4 font-display text-5xl leading-tight md:text-7xl first-letter:uppercase">{longDate(b.date)}</h1>
      <p className="mt-3 text-2xl text-ivory/70">
        {clock(b.start_min)} – {clock(b.end_min)}
      </p>
      <span
        className={`mt-6 inline-block rounded-full px-4 py-1.5 text-xs font-semibold ${
          b.status === "cancelled" ? "bg-blush/20 text-blush" : b.status === "pending" ? "bg-gold/20 text-gold" : "bg-emerald-500/15 text-emerald-300"
        }`}
      >
        {STATUS_LABEL[b.status]}
      </span>

      <div className="mt-10 rounded-[1.75rem] border border-white/10 bg-coal/60 p-7">
        <ul className="space-y-3">
          {b.services.map((s, i) => (
            <li key={i} className="flex justify-between gap-4">
              <span>
                {s.name}
                <span className="block text-xs text-ivory/40">{duration(s.duration_min)}</span>
              </span>
              <span className="text-ivory/70">{priceLabel(s.price, false)}</span>
            </li>
          ))}
        </ul>
        <div className="hairline my-6" />
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="eyebrow text-ivory/40">Especialista</dt>
            <dd className="mt-1 text-lg">{b.staff_name}</dd>
          </div>
          <div>
            <dt className="eyebrow text-ivory/40">Sede</dt>
            <dd className="mt-1 text-lg">{b.location_name}</dd>
            <dd className="text-ivory/50">{b.location_address}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {cancellable && (
          <>
            <a href={reschedule} target="_blank" rel="noreferrer" className="rounded-full bg-ivory px-6 py-3 text-sm font-semibold text-ink hover:bg-champagne">
              Reprogramar por WhatsApp
            </a>
            <form action={cancel}>
              <button className="rounded-full border border-blush/50 px-6 py-3 text-sm text-blush hover:bg-blush/10">Cancelar cita</button>
            </form>
          </>
        )}
        <Link href="/reservar" className="rounded-full border border-white/20 px-6 py-3 text-sm hover:border-champagne">
          Agendar otra cita
        </Link>
      </div>
      {cancellable && <p className="mt-4 text-xs text-ivory/40">Si no puedes asistir, cancélala para liberar el espacio a otra persona. ¡Gracias!</p>}
    </div>
  );
}
