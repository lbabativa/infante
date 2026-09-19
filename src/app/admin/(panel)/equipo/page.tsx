import Link from "next/link";
import { PageTitle } from "@/components/admin/ui";
import { Portrait } from "@/components/site/Portrait";
import { listStaff } from "@/lib/repo";

export const metadata = { title: "Equipo" };

export default function EquipoAdmin() {
  const staff = listStaff({ includeInactive: true });
  return (
    <>
      <PageTitle title="Equipo" sub="Fotos, biografías, horarios y servicios de cada especialista">
        <Link href="/admin/equipo/nuevo" className="btn">
          + Agregar especialista
        </Link>
      </PageTitle>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {staff.map((s, i) => (
          <Link key={s.id} href={`/admin/equipo/${s.id}`} className={`card group overflow-hidden ${s.active ? "" : "opacity-50"}`}>
            <div className="aspect-[4/5] overflow-hidden bg-[#0c0b0a] text-[#f4efe7]">
              <Portrait name={s.name} photo={s.photo_url} index={i} />
            </div>
            <div className="p-3">
              <p className="font-semibold">{s.name}</p>
              <p className="text-xs text-[#7a6f62]">{s.role}</p>
              <p className="mt-2 text-[0.68rem] text-[#9a8f80]">
                {!s.active ? "Inactivo" : !s.bookable ? "No recibe reservas" : s.service_ids.length ? `${s.service_ids.length} servicios` : "Todos los servicios"}
                {!s.photo_url && " · sin foto"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
