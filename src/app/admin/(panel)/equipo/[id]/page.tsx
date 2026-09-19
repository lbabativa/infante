import Link from "next/link";
import { notFound } from "next/navigation";
import { addTimeOff, deleteTimeOff, saveStaff } from "@/app/admin/actions";
import { HoursEditor, PageTitle } from "@/components/admin/ui";
import { Portrait } from "@/components/site/Portrait";
import { bogotaNow, hhmm, shortDate } from "@/lib/format";
import { catalog, getStaff, listLocations, listTimeOff, type Staff } from "@/lib/repo";
import { seedLocation } from "@/lib/seed-data";

export const metadata = { title: "Especialista" };

export default async function StaffEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string }> }) {
  const { id } = await params;
  const { ok } = await searchParams;
  const isNew = id === "nuevo";
  const s: Staff | undefined = isNew
    ? undefined
    : (await getStaff(Number(id))) ?? notFound();
  const [locations, cats, offs] = await Promise.all([
    listLocations({ includeInactive: true }),
    catalog(),
    s ? listTimeOff({ staff_id: s.id, date: { $gte: bogotaNow().date } }) : [],
  ]);
  const allServices = !s || s.service_ids.length === 0;

  return (
    <>
      <PageTitle title={s?.name ?? "Nuevo especialista"} sub={s?.role ?? undefined}>
        <Link href="/admin/equipo" className="btn btn-ghost">
          ← Equipo
        </Link>
      </PageTitle>
      {ok && <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Cambios guardados. Ya se ven en el sitio web.</p>}

      <form action={saveStaff} className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {s && <input type="hidden" name="id" value={s.id} />}
        <div className="space-y-6">
          <section className="card space-y-3 p-5">
            <div className="flex gap-4">
              <div className="h-40 w-32 shrink-0 overflow-hidden rounded-xl bg-[#0c0b0a] text-[#f4efe7]">
                <Portrait name={s?.name ?? "N N"} photo={s?.photo_url} />
              </div>
              <div className="flex-1 space-y-2">
                <label className="field">
                  Subir foto (JPG/PNG/WebP, vertical)
                  <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" className="text-xs" />
                </label>
                <label className="field">
                  …o URL de la foto
                  <input name="photo_url" defaultValue={s?.photo_url ?? ""} className="input" />
                </label>
              </div>
            </div>
            <label className="field">
              Nombre *
              <input name="name" required defaultValue={s?.name} className="input" />
            </label>
            <label className="field">
              Rol / especialidad
              <input name="role" defaultValue={s?.role ?? ""} placeholder="Colorista, corte de autor…" className="input" />
            </label>
            <label className="field">
              Biografía corta (se muestra en el sitio)
              <textarea name="bio" rows={3} defaultValue={s?.bio ?? ""} className="input" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="field">
                Instagram
                <input name="instagram" defaultValue={s?.instagram ?? ""} placeholder="@usuario" className="input" />
              </label>
              <label className="field">
                Celular
                <input name="phone" defaultValue={s?.phone ?? ""} className="input" />
              </label>
              <label className="field">
                Sede
                <select name="location_id" defaultValue={s?.location_id ?? ""} className="input">
                  <option value="">Todas</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Orden en el sitio
                <input name="sort" type="number" defaultValue={s?.sort ?? 99} className="input" />
              </label>
            </div>
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="active" defaultChecked={s ? !!s.active : true} className="accent-[#a8864f]" /> Visible en el sitio
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="bookable" defaultChecked={s ? !!s.bookable : true} className="accent-[#a8864f]" /> Recibe reservas
              </label>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold">Horario semanal</h2>
            <HoursEditor hours={s?.schedule ?? seedLocation.hours} />
          </section>
          <button className="btn w-full justify-center py-3">Guardar cambios</button>
        </div>

        <section className="card p-5">
          <h2 className="font-semibold">Servicios que realiza</h2>
          <label className="mt-3 flex items-center gap-2 rounded-lg bg-[#fbf6ee] p-3 text-sm">
            <input type="checkbox" name="all_services" defaultChecked={allServices} className="accent-[#a8864f]" />
            <span>
              <b>Todos los servicios</b> (incluye los que se agreguen en el futuro). Desmarca para elegir abajo.
            </span>
          </label>
          <div className="mt-4 max-h-[44rem] space-y-4 overflow-y-auto pr-2">
            {cats.map((c) => (
              <div key={c.id}>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#a8864f]">{c.name}</p>
                <div className="grid gap-1 sm:grid-cols-2">
                  {c.services.map((sv) => (
                    <label key={sv.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="service_ids" value={sv.id} defaultChecked={allServices || s!.service_ids.includes(sv.id)} className="accent-[#a8864f]" />
                      {sv.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </form>

      {s && (
        <section className="card mt-6 p-5">
          <h2 className="mb-1 font-semibold">Ausencias y bloqueos</h2>
          <p className="mb-4 text-xs text-[#7a6f62]">Vacaciones, citas médicas, capacitaciones… Esos espacios dejan de ofrecerse en el sitio.</p>
          <form action={addTimeOff} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="staff_id" value={s.id} />
            <label className="field">
              Fecha
              <input type="date" name="date" required className="input" />
            </label>
            <label className="field">
              Desde
              <input type="time" name="start" defaultValue="08:00" className="input" />
            </label>
            <label className="field">
              Hasta
              <input type="time" name="end" defaultValue="12:00" className="input" />
            </label>
            <label className="mb-2 flex items-center gap-2 text-sm">
              <input type="checkbox" name="all_day" className="accent-[#a8864f]" /> Todo el día
            </label>
            <label className="field min-w-48 flex-1">
              Motivo
              <input name="reason" className="input" />
            </label>
            <button className="btn mb-0.5">Bloquear</button>
          </form>
          {offs.length > 0 && (
            <ul className="mt-4 divide-y divide-[#f4efe7] text-sm">
              {offs.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2">
                  <span>
                    {shortDate(o.date)} · {o.end_min - o.start_min >= 1440 ? "todo el día" : `${hhmm(o.start_min)}–${hhmm(o.end_min)}`}
                    {o.reason && <span className="text-[#7a6f62]"> · {o.reason}</span>}
                  </span>
                  <form action={deleteTimeOff}>
                    <input type="hidden" name="id" value={o.id} />
                    <button className="btn btn-ghost btn-sm">Quitar</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
