import Link from "next/link";
import { BookingActions } from "@/components/admin/BookingActions";
import { Empty, PageTitle, StatusBadge } from "@/components/admin/ui";
import { all, get } from "@/lib/db";
import { addDays, bogotaNow, clock, cop, longDate, shortDate, prettyPhone } from "@/lib/format";
import { pendingManualCount, runAutomations } from "@/lib/notify";
import { listBookings } from "@/lib/repo";

export const metadata = { title: "Hoy" };

export default async function Dashboard() {
  // Sin cron configurado, las automatizaciones corren también al abrir el panel.
  await runAutomations();
  const now = bogotaNow();
  const today = listBookings({ from: now.date, to: now.date });
  const active = today.filter((b) => b.status !== "cancelled");
  const pending = listBookings({ status: "pending", from: now.date, limit: 20 });
  const revenue = active.filter((b) => b.status !== "no_show").reduce((a, b) => a + (b.total_price ?? 0), 0);
  const manual = pendingManualCount();
  const next = active.find((b) => b.start_min >= now.minutes && b.status === "confirmed");

  const week = Array.from({ length: 7 }, (_, i) => addDays(now.date, i));
  const perDay = all<{ date: string; n: number }>(
    `SELECT date, COUNT(*) AS n FROM bookings WHERE date BETWEEN ? AND ? AND status IN ('pending','confirmed') GROUP BY date`,
    week[0],
    week[6]
  );
  const max = Math.max(1, ...perDay.map((d) => d.n));
  const newClients = get<{ n: number }>("SELECT COUNT(*) AS n FROM clients WHERE date(created_at) >= date('now','-30 day')")?.n ?? 0;

  return (
    <>
      <PageTitle title="Hoy" sub={longDate(now.date)}>
        <Link href="/admin/citas/nueva" className="btn">
          + Nueva cita
        </Link>
        <Link href="/admin/agenda" className="btn btn-ghost">
          Ver agenda
        </Link>
      </PageTitle>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Citas hoy" value={String(active.length)} />
        <Kpi label="Ingresos estimados hoy" value={cop(revenue)} />
        <Kpi label="Por confirmar" value={String(pending.length)} href="/admin/citas?estado=pending" alert={pending.length > 0} />
        <Kpi label="Mensajes por enviar" value={String(manual)} href="/admin/mensajes?estado=manual" alert={manual > 0} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Citas de hoy</h2>
            {next && (
              <p className="text-xs text-[#7a6f62]">
                Siguiente: <b>{clock(next.start_min)}</b> · {next.client_name}
              </p>
            )}
          </div>
          {today.length === 0 ? (
            <Empty>No hay citas para hoy.</Empty>
          ) : (
            <ul className="divide-y divide-[#efe8dd]">
              {today.map((b) => (
                <li key={b.id} className={`flex flex-wrap items-center gap-4 py-3 ${b.end_min < now.minutes && b.status === "confirmed" ? "opacity-70" : ""}`}>
                  <div className="w-20 shrink-0">
                    <p className="font-display text-xl leading-none">{clock(b.start_min).replace(/ [ap]\. m\./, "")}</p>
                    <p className="text-[0.7rem] text-[#9a8f80]">{clock(b.start_min).slice(-5)}</p>
                  </div>
                  <Link href={`/admin/citas/${b.id}`} className="min-w-0 flex-1 hover:underline">
                    <p className="truncate font-medium">{b.client_name}</p>
                    <p className="truncate text-xs text-[#7a6f62]">
                      {b.services.map((s) => s.name).join(" + ")} · {b.staff_name}
                    </p>
                  </Link>
                  <StatusBadge status={b.status} />
                  <BookingActions id={b.id} status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Próximos 7 días</h2>
            <div className="flex h-36 items-end gap-2">
              {week.map((d) => {
                const n = perDay.find((p) => p.date === d)?.n ?? 0;
                return (
                  <Link key={d} href={`/admin/agenda?fecha=${d}`} className="group flex flex-1 flex-col items-center gap-1">
                    <span className="text-[0.7rem] font-semibold">{n || ""}</span>
                    <span className="w-full rounded-t-md bg-[#c9a877] transition group-hover:bg-[#a8864f]" style={{ height: `${(n / max) * 100}px`, minHeight: 3 }} />
                    <span className="text-[0.65rem] text-[#7a6f62]">{shortDate(d).split(" ").slice(0, 2).join(" ")}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold">Solicitudes por confirmar</h2>
            {pending.length === 0 ? (
              <p className="text-sm text-[#7a6f62]">Todo al día ✨</p>
            ) : (
              <ul className="space-y-3">
                {pending.map((b) => (
                  <li key={b.id} className="text-sm">
                    <Link href={`/admin/citas/${b.id}`} className="font-medium hover:underline">
                      {b.client_name}
                    </Link>
                    <p className="text-xs text-[#7a6f62]">
                      {shortDate(b.date)} · {clock(b.start_min)} · {prettyPhone(b.client_phone)}
                    </p>
                    <div className="mt-1.5">
                      <BookingActions id={b.id} status={b.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5 text-sm">
            <p className="text-[#7a6f62]">Clientes nuevos (30 días)</p>
            <p className="font-display text-3xl">{newClients}</p>
          </section>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, href, alert }: { label: string; value: string; href?: string; alert?: boolean }) {
  const inner = (
    <div className={`card h-full p-5 ${alert ? "!border-[#c9a877] !bg-[#fbf6ee]" : ""}`}>
      <p className="text-xs text-[#7a6f62]">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
