import Link from "next/link";
import { PageTitle, STATUS_BLOCK } from "@/components/admin/ui";
import { all } from "@/lib/db";
import { addDays, bogotaNow, clock, hhmm, longDate, weekday } from "@/lib/format";
import { listBookings, listLocations, listStaff } from "@/lib/repo";

export const metadata = { title: "Agenda" };

const ROW = 30; // minutos por fila
const PX = 44; // alto de cada fila

export default async function AgendaPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const now = bogotaNow();
  const date = sp.fecha && /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha) ? sp.fecha : now.date;
  const locations = listLocations().filter((l) => l.active);
  const location = locations.find((l) => l.id === Number(sp.sede)) ?? locations[0];
  const wd = weekday(date);
  const hours = location?.hours[wd];
  const [open, close] = hours ?? [480, 1140];
  const staff = listStaff().filter((s) => s.bookable && (s.location_id == null || s.location_id === location?.id));
  const bookings = listBookings({ from: date, to: date, locationId: location?.id }).filter((b) => b.status !== "cancelled" || sp.canceladas);
  const off = all<{ id: number; staff_id: number | null; start_min: number; end_min: number; reason: string | null }>(
    "SELECT * FROM time_off WHERE date = ? AND (location_id IS NULL OR location_id = ?)",
    date,
    location?.id ?? 0
  );
  const rows = Array.from({ length: Math.ceil((close - open) / ROW) }, (_, i) => open + i * ROW);
  const top = (m: number) => ((m - open) / ROW) * PX;
  const q = (d: string) => `/admin/agenda?fecha=${d}${location ? `&sede=${location.id}` : ""}`;

  return (
    <>
      <PageTitle title="Agenda" sub={longDate(date) + (hours ? "" : " · sede cerrada")}>
        <Link href={q(addDays(date, -1))} className="btn btn-ghost btn-sm">
          ←
        </Link>
        <Link href={q(now.date)} className="btn btn-ghost btn-sm">
          Hoy
        </Link>
        <Link href={q(addDays(date, 1))} className="btn btn-ghost btn-sm">
          →
        </Link>
        <form className="flex gap-2">
          <input type="date" name="fecha" defaultValue={date} className="input !w-auto !py-1" />
          {location && <input type="hidden" name="sede" value={location.id} />}
          <button className="btn btn-ghost btn-sm">Ir</button>
        </form>
        <Link href={`/admin/citas/nueva?fecha=${date}`} className="btn btn-sm">
          + Nueva cita
        </Link>
      </PageTitle>

      {locations.length > 1 && (
        <div className="mb-4 flex gap-2">
          {locations.map((l) => (
            <Link key={l.id} href={`/admin/agenda?fecha=${date}&sede=${l.id}`} className={`btn btn-sm ${l.id === location?.id ? "" : "btn-ghost"}`}>
              {l.name}
            </Link>
          ))}
        </div>
      )}

      <div className="card overflow-x-auto">
        <div className="grid min-w-max" style={{ gridTemplateColumns: `64px repeat(${staff.length}, minmax(150px, 1fr))` }}>
          {/* Encabezados */}
          <div className="sticky left-0 z-20 border-b border-[#efe8dd] bg-white" />
          {staff.map((s) => (
            <div key={s.id} className="border-b border-l border-[#efe8dd] px-3 py-3 text-center">
              <Link href={`/admin/equipo/${s.id}`} className="text-sm font-semibold hover:underline">
                {s.name.split(" ")[0]} {s.name.split(" ")[1]?.[0]}.
              </Link>
              <p className="text-[0.68rem] text-[#9a8f80]">
                {s.schedule[wd] ? `${hhmm(s.schedule[wd]![0])}–${hhmm(s.schedule[wd]![1])}` : "No trabaja"}
              </p>
            </div>
          ))}

          {/* Horas */}
          <div className="sticky left-0 z-10 bg-white">
            {rows.map((m) => (
              <div key={m} style={{ height: PX }} className="border-b border-[#f4efe7] pr-2 text-right text-[0.68rem] text-[#9a8f80]">
                {m % 60 === 0 ? hhmm(m) : ""}
              </div>
            ))}
          </div>

          {/* Columnas por especialista */}
          {staff.map((s) => {
            const w = s.schedule[wd];
            return (
              <div key={s.id} className="relative border-l border-[#efe8dd]" style={{ height: rows.length * PX }}>
                {rows.map((m) => (
                  <Link
                    key={m}
                    href={`/admin/citas/nueva?fecha=${date}&hora=${hhmm(m)}&especialista=${s.id}`}
                    title={`Nueva cita ${hhmm(m)}`}
                    style={{ height: PX }}
                    className={`block border-b border-[#f4efe7] transition hover:bg-[#fbf6ee] ${m % 60 === 0 ? "" : "border-dashed"}`}
                  />
                ))}
                {/* Fuera de horario */}
                {(!w ? [[open, close]] : [[open, w[0]], [w[1], close]]).map(([a, b], i) =>
                  b > a ? (
                    <div
                      key={i}
                      className="pointer-events-none absolute inset-x-0 bg-[repeating-linear-gradient(135deg,#f4efe7,#f4efe7_6px,#ece4d8_6px,#ece4d8_12px)] opacity-70"
                      style={{ top: top(Math.max(a, open)), height: top(Math.min(b, close)) - top(Math.max(a, open)) }}
                    />
                  ) : null
                )}
                {off
                  .filter((o) => o.staff_id === s.id || o.staff_id == null)
                  .map((o) => (
                    <div
                      key={o.id}
                      className="absolute inset-x-1 flex items-start rounded-md bg-stone-300/60 p-1.5 text-[0.68rem] text-stone-700"
                      style={{ top: top(Math.max(o.start_min, open)), height: Math.max(20, top(Math.min(o.end_min, close)) - top(Math.max(o.start_min, open))) }}
                    >
                      Bloqueado{o.reason ? ` · ${o.reason}` : ""}
                    </div>
                  ))}
                {bookings
                  .filter((b) => b.staff_id === s.id)
                  .map((b) => (
                    <Link
                      key={b.id}
                      href={`/admin/citas/${b.id}`}
                      className={`absolute inset-x-1 overflow-hidden rounded-md border-l-4 p-1.5 text-[0.72rem] leading-tight shadow-sm transition hover:z-10 hover:shadow-md ${STATUS_BLOCK[b.status]}`}
                      style={{ top: top(b.start_min) + 1, height: Math.max(22, top(b.end_min) - top(b.start_min) - 2) }}
                    >
                      <p className="font-semibold">
                        {clock(b.start_min)} · {b.client_name}
                      </p>
                      <p className="opacity-75">{b.services.map((x) => x.name).join(" + ")}</p>
                    </Link>
                  ))}
                {date === now.date && now.minutes > open && now.minutes < close && (
                  <div className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-red-500" style={{ top: top(now.minutes) }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-xs text-[#7a6f62]">
        Haz clic en un espacio libre para crear una cita. Las franjas rayadas son fuera del horario del especialista.{" "}
        <Link className="underline" href={`${q(date)}&canceladas=1`}>
          Mostrar canceladas
        </Link>
      </p>
    </>
  );
}
