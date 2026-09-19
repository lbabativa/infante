import Link from "next/link";
import { notFound } from "next/navigation";
import { saveClient } from "@/app/admin/actions";
import { PageTitle, StatusBadge } from "@/components/admin/ui";
import { get } from "@/lib/db";
import { clock, money, shortDate } from "@/lib/format";
import { listBookings } from "@/lib/repo";

export const metadata = { title: "Cliente" };

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const c = get<{ id: number; name: string; phone: string; email: string | null; notes: string | null; created_at: string }>("SELECT * FROM clients WHERE id = ?", id);
  if (!c) notFound();
  const bookings = listBookings({ clientId: id, order: "desc" });
  const spent = bookings.filter((b) => b.status === "completed").reduce((a, b) => a + (b.total_price ?? 0), 0);

  return (
    <>
      <PageTitle title={c.name} sub={`Cliente desde ${shortDate(c.created_at.slice(0, 10))} · consumo ${money(spent)}`}>
        <Link href="/admin/citas/nueva" className="btn">
          + Nueva cita
        </Link>
      </PageTitle>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <form action={saveClient} className="card space-y-3 p-5">
          <input type="hidden" name="id" value={c.id} />
          <label className="field">
            Nombre
            <input name="name" defaultValue={c.name} className="input" />
          </label>
          <label className="field">
            Celular
            <input name="phone" defaultValue={c.phone} className="input" />
          </label>
          <label className="field">
            Correo
            <input name="email" defaultValue={c.email ?? ""} className="input" />
          </label>
          <label className="field">
            Notas (fórmulas, alergias, preferencias)
            <textarea name="notes" rows={5} defaultValue={c.notes ?? ""} className="input" />
          </label>
          <button className="btn">Guardar</button>
        </form>
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Historial ({bookings.length})</h2>
          <ul className="divide-y divide-[#f4efe7]">
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center gap-4 py-3 text-sm">
                <Link href={`/admin/citas/${b.id}`} className="w-28 shrink-0 hover:underline">
                  {shortDate(b.date)}
                  <span className="block text-xs text-[#7a6f62]">{clock(b.start_min)}</span>
                </Link>
                <span className="min-w-0 flex-1 truncate">
                  {b.services.map((s) => s.name).join(" + ")}
                  <span className="block text-xs text-[#7a6f62]">{b.staff_name}</span>
                </span>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
