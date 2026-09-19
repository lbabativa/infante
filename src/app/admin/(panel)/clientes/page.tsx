import Link from "next/link";
import { Empty, PageTitle } from "@/components/admin/ui";
import { all } from "@/lib/db";
import { money, prettyPhone, shortDate } from "@/lib/format";
import { waLink } from "@/lib/notify";

export const metadata = { title: "Clientes" };

type Row = { id: number; name: string; phone: string; email: string | null; visits: number; spent: number | null; last: string | null; next: string | null };

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const rows = all<Row>(
    `SELECT c.id, c.name, c.phone, c.email,
       SUM(b.status = 'completed') AS visits,
       SUM(CASE WHEN b.status = 'completed' THEN b.total_price END) AS spent,
       MAX(CASE WHEN b.status = 'completed' THEN b.date END) AS last,
       MIN(CASE WHEN b.status IN ('pending','confirmed') AND b.date >= date('now','-5 hours') THEN b.date END) AS next
     FROM clients c LEFT JOIN bookings b ON b.client_id = c.id
     WHERE c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?
     GROUP BY c.id ORDER BY COALESCE(last, c.created_at) DESC LIMIT 300`,
    `%${q}%`,
    `%${q}%`,
    `%${q}%`
  );
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
