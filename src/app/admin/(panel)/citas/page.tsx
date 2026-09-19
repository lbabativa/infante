import Link from "next/link";
import { Empty, PageTitle, StatusBadge } from "@/components/admin/ui";
import { addDays, bogotaNow, clock, money, prettyPhone, shortDate } from "@/lib/format";
import { listBookings, listStaff, STATUS_LABEL } from "@/lib/repo";

export const metadata = { title: "Citas" };

export default async function CitasPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const now = bogotaNow();
  const from = sp.desde ?? (sp.estado || sp.q ? undefined : now.date);
  const to = sp.hasta ?? (sp.estado || sp.q ? undefined : addDays(now.date, 30));
  const bookings = await listBookings({ from, to, status: sp.estado, staffId: Number(sp.especialista) || undefined, q: sp.q, limit: 300 });
  const staff = await listStaff();

  return (
    <>
      <PageTitle title="Citas" sub={`${bookings.length} resultados`}>
        <Link href="/admin/citas/nueva" className="btn">
          + Nueva cita
        </Link>
      </PageTitle>

      <form className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <input name="q" defaultValue={sp.q} placeholder="Nombre, celular o código" className="input lg:col-span-2" />
        <select name="estado" defaultValue={sp.estado ?? ""} className="input">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select name="especialista" defaultValue={sp.especialista ?? ""} className="input">
          <option value="">Todo el equipo</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input type="date" name="desde" defaultValue={from} className="input" />
        <div className="flex gap-2">
          <input type="date" name="hasta" defaultValue={to} className="input" />
          <button className="btn">Filtrar</button>
        </div>
      </form>

      {bookings.length === 0 ? (
        <Empty>No hay citas con estos filtros.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-[#7a6f62]">
              <tr className="border-b border-[#efe8dd]">
                <th className="p-3">Fecha</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Servicios</th>
                <th className="p-3">Especialista</th>
                <th className="p-3 text-right">Valor</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Origen</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-[#f4efe7] hover:bg-[#fbf8f3]">
                  <td className="whitespace-nowrap p-3">
                    <Link href={`/admin/citas/${b.id}`} className="font-medium hover:underline">
                      {shortDate(b.date)}
                    </Link>
                    <p className="text-xs text-[#7a6f62]">{clock(b.start_min)}</p>
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/citas/${b.id}`} className="hover:underline">
                      {b.client_name}
                    </Link>
                    <p className="text-xs text-[#7a6f62]">{prettyPhone(b.client_phone)}</p>
                  </td>
                  <td className="max-w-64 truncate p-3">{b.services.map((s) => s.name).join(" + ")}</td>
                  <td className="whitespace-nowrap p-3">{b.staff_name}</td>
                  <td className="whitespace-nowrap p-3 text-right">{b.total_price != null ? money(b.total_price) : "—"}</td>
                  <td className="p-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="p-3 text-xs uppercase text-[#7a6f62]">{b.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
