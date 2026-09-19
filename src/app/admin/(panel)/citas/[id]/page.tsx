import Link from "next/link";
import { notFound } from "next/navigation";
import { reschedule, saveBookingNotes } from "@/app/admin/actions";
import { BookingActions } from "@/components/admin/BookingActions";
import { PageTitle, StatusBadge } from "@/components/admin/ui";
import { col, NO_ID } from "@/lib/db";
import { clock, duration, hhmm, longDate, money, prettyPhone } from "@/lib/format";
import { waLink, type Message } from "@/lib/notify";
import { getBooking, listStaff } from "@/lib/repo";

export const metadata = { title: "Cita" };

export default async function CitaPage({ params }: { params: Promise<{ id: string }> }) {
  const b = await getBooking(Number((await params).id));
  if (!b) notFound();
  const [staff, messages, history] = await Promise.all([
    listStaff(),
    (await col<Message>("messages")).find({ booking_id: b.id }, NO_ID).sort({ id: -1 }).toArray(),
    (await col("bookings")).countDocuments({ client_id: b.client_id, status: "completed" }),
  ]);

  return (
    <>
      <PageTitle title={b.client_name} sub={`${longDate(b.date)} · ${clock(b.start_min)} – ${clock(b.end_min)}`}>
        <StatusBadge status={b.status} />
        <BookingActions id={b.id} status={b.status} size="md" />
      </PageTitle>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Servicios</h2>
            <ul className="divide-y divide-[#f4efe7] text-sm">
              {b.services.map((s, i) => (
                <li key={i} className="flex justify-between py-2">
                  <span>
                    {s.name} <span className="text-xs text-[#9a8f80]">· {duration(s.duration_min)}</span>
                  </span>
                  <span>{money(s.price)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-[#efe8dd] pt-3 font-semibold">
              <span>Total</span>
              <span>{b.total_price != null ? money(b.total_price) : "Por valorar"}</span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-[#7a6f62]">Especialista</dt>
                <dd>{b.staff_name}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#7a6f62]">Sede</dt>
                <dd>{b.location_name}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#7a6f62]">Código</dt>
                <dd className="font-mono">{b.code}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#7a6f62]">Origen</dt>
                <dd className="uppercase">{b.source}</dd>
              </div>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Reprogramar</h2>
            <form action={reschedule} className="grid gap-3 sm:grid-cols-4">
              <input type="hidden" name="id" value={b.id} />
              <input type="date" name="date" defaultValue={b.date} className="input" required />
              <input type="time" name="time" step={900} defaultValue={hhmm(b.start_min)} className="input" required />
              <select name="staffId" defaultValue={b.staff_id} className="input">
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button className="btn justify-center">Guardar y avisar</button>
            </form>
            <p className="mt-2 text-xs text-[#7a6f62]">Se envía al cliente la nueva confirmación y se reprograman los recordatorios.</p>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Mensajes enviados</h2>
            {messages.length === 0 ? (
              <p className="text-sm text-[#7a6f62]">Sin mensajes.</p>
            ) : (
              <ul className="space-y-3">
                {messages.map((m) => (
                  <li key={m.id} className="rounded-lg bg-[#f8f4ee] p-3 text-sm">
                    <p className="mb-1 flex justify-between text-xs text-[#7a6f62]">
                      <span>
                        {m.template.replace("tpl_", "").replace("_", " ")} · {m.channel}
                      </span>
                      <span>
                        {m.status === "sent" ? "✓ enviado" : m.status === "manual" ? "pendiente de envío" : "falló"} · {m.created_at.slice(5, 16).replace("T", " ")}
                      </span>
                    </p>
                    <p className="whitespace-pre-line">{m.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 font-semibold">Cliente</h2>
            <p>{b.client_name}</p>
            <p className="text-sm text-[#7a6f62]">{prettyPhone(b.client_phone)}</p>
            {b.client_email && <p className="text-sm text-[#7a6f62]">{b.client_email}</p>}
            <p className="mt-2 text-xs text-[#7a6f62]">{history} visitas atendidas</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={waLink(b.client_phone, `Hola ${b.client_name.split(" ")[0]} 👋 te escribimos de Infante Hair Stylist.`)} target="_blank" rel="noreferrer" className="btn btn-sm">
                WhatsApp
              </a>
              <a href={`tel:+${b.client_phone}`} className="btn btn-ghost btn-sm">
                Llamar
              </a>
              <Link href={`/admin/clientes/${b.client_id}`} className="btn btn-ghost btn-sm">
                Ver ficha
              </Link>
            </div>
          </section>
          <section className="card p-5">
            <h2 className="mb-3 font-semibold">Notas</h2>
            <form action={saveBookingNotes} className="space-y-2">
              <input type="hidden" name="id" value={b.id} />
              <textarea name="notes" rows={4} defaultValue={b.notes ?? ""} className="input" placeholder="Fórmula de color, preferencias…" />
              <button className="btn btn-sm">Guardar notas</button>
            </form>
          </section>
          <Link href={`/reserva/${b.code}`} target="_blank" className="block text-center text-xs text-[#7a6f62] underline">
            Ver la página del cliente ↗
          </Link>
        </div>
      </div>
    </>
  );
}
