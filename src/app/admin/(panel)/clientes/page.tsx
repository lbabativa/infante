import Link from "next/link";
import { Empty, PageTitle } from "@/components/admin/ui";
import { col, NO_ID } from "@/lib/db";
import type { BookingDoc, Client } from "@/lib/repo";
import { bogotaNow, money, prettyPhone, shortDate } from "@/lib/format";
import { waLink } from "@/lib/notify";

export const metadata = { title: "Clientes" };

type Row = { id: number; name: string; phone: string; email: string | null; visits: number; spent: number | null; last: string | null; next: string | null };

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const clients = await (await col<Client>("clients"))
    .find(q ? { $or: [{ name: re }, { phone: re }, { email: re }] } : {}, NO_ID)
    .sort({ created_at: -1 })
    .limit(300)
    .toArray();
  const bookings = await (await col<BookingDoc>("bookings"))
    .find({ client_id: { $in: clients.map((c) => c.id) } }, { projection: { client_id: 1, status: 1, date: 1, total_price: 1 } })
    .toArray();
  const today = bogotaNow().date;
  const rows: Row[] = clients
    .map((c) => {
      const mine = bookings.filter((b) => b.client_id === c.id);
      const done = mine.filter((b) => b.status === "completed");
      const upcoming = mine.filter((b) => ["pending", "confirmed"].includes(b.status) && b.date >= today).map((b) => b.date).sort();
      return {
        ...c,
        visits: done.length,
        spent: done.reduce((a, b) => a + (b.total_price ?? 0), 0) || null,
        last: done.map((b) => b.date).sort().at(-1) ?? null,
        next: upcoming[0] ?? null,
        sortKey: done.map((b) => b.date).sort().at(-1) ?? c.created_at,
      };
    })
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  return (
    <>
      <PageTitle title="Clientes" sub={`${rows.length} clientes`}>
        <form>
          <input name="q" defaultValue={q} placeholder="Buscar nombre, celular…" className="input !w-64" />
        </form>
      </PageTitle>
      {rows.length === 0 ? (
        <Empty>Aún no hay clientes. Se crean automáticamente con cada reserva.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-[#7a6f62]">
              <tr className="border-b border-[#efe8dd]">
                <th className="p-3">Cliente</th>
                <th className="p-3">Celular</th>
                <th className="p-3 text-right">Visitas</th>
                <th className="p-3 text-right">Consumo</th>
                <th className="p-3">Última visita</th>
                <th className="p-3">Próxima cita</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[#f4efe7] hover:bg-[#fbf8f3]">
                  <td className="p-3">
                    <Link href={`/admin/clientes/${r.id}`} className="font-medium hover:underline">
                      {r.name}
                    </Link>
                    {r.email && <p className="text-xs text-[#7a6f62]">{r.email}</p>}
                  </td>
                  <td className="whitespace-nowrap p-3">{prettyPhone(r.phone)}</td>
                  <td className="p-3 text-right">{r.visits ?? 0}</td>
                  <td className="whitespace-nowrap p-3 text-right">{r.spent ? money(r.spent) : "—"}</td>
                  <td className="whitespace-nowrap p-3">{r.last ? shortDate(r.last) : "—"}</td>
                  <td className="whitespace-nowrap p-3">{r.next ? shortDate(r.next) : "—"}</td>
                  <td className="p-3">
                    <a href={waLink(r.phone, `Hola ${r.name.split(" ")[0]} 👋`)} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                      WhatsApp
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
