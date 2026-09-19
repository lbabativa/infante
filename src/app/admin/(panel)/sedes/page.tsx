import { addTimeOff, saveLocation } from "@/app/admin/actions";
import { HoursEditor, PageTitle } from "@/components/admin/ui";
import { listLocations, type Location } from "@/lib/repo";
import { seedLocation } from "@/lib/seed-data";

export const metadata = { title: "Sedes" };

export default async function SedesAdmin() {
  const locations = await listLocations({ includeInactive: true });
  return (
    <>
      <PageTitle title="Sedes" sub="Cada sede tiene su propio horario y equipo. Las sedes “próximamente” se anuncian en el sitio sin recibir reservas." />
      <div className="space-y-6">
        {locations.map((l) => (
          <LocationForm key={l.id} l={l} />
        ))}
        <details className="card p-5">
          <summary className="cursor-pointer font-semibold text-[#a8864f]">+ Agregar nueva sede</summary>
          <div className="mt-4">
            <LocationForm />
          </div>
        </details>
      </div>
    </>
  );
}

function LocationForm({ l }: { l?: Location }) {
  return (
    <div className={l ? "card p-5" : ""}>
      <form action={saveLocation} className="grid gap-4 lg:grid-cols-2">
        {l && <input type="hidden" name="id" value={l.id} />}
        <div className="grid content-start gap-3 sm:grid-cols-2">
          <label className="field sm:col-span-2">
            Nombre
            <input name="name" required defaultValue={l?.name} className="input !font-display !text-lg" />
          </label>
          <label className="field sm:col-span-2">
            Dirección
            <input name="address" required defaultValue={l?.address} className="input" />
          </label>
          <label className="field">
            Ciudad
            <input name="city" defaultValue={l?.city ?? "Bogotá D.C."} className="input" />
          </label>
          <label className="field">
            Teléfono
            <input name="phone" defaultValue={l?.phone ?? ""} className="input" />
          </label>
          <label className="field">
            WhatsApp
            <input name="whatsapp" defaultValue={l?.whatsapp ?? ""} className="input" />
          </label>
          <label className="field">
            Orden
            <input name="sort" type="number" defaultValue={l?.sort ?? 9} className="input" />
          </label>
          <label className="field sm:col-span-2">
            Enlace de Google Maps
            <input name="maps_url" defaultValue={l?.maps_url ?? ""} className="input" />
          </label>
          <div className="flex gap-6 text-sm sm:col-span-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="active" defaultChecked={l ? !!l.active : false} className="accent-[#a8864f]" /> Abierta (recibe reservas)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="coming_soon" defaultChecked={l ? !!l.coming_soon : true} className="accent-[#a8864f]" /> Anunciar como “próximamente”
            </label>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#5f564b]">Horario de atención</p>
          <HoursEditor hours={l?.hours ?? seedLocation.hours} />
          <button className="btn">{l ? "Guardar sede" : "Crear sede"}</button>
        </div>
      </form>
      {l && !!l.active && (
        <form action={addTimeOff} className="mt-5 flex flex-wrap items-end gap-3 border-t border-[#efe8dd] pt-4">
          <input type="hidden" name="location_id" value={l.id} />
          <input type="hidden" name="all_day" value="1" />
          <p className="w-full text-xs font-semibold text-[#5f564b]">Cerrar la sede un día (festivo, evento…)</p>
          <input type="date" name="date" required className="input !w-auto" />
          <input name="reason" placeholder="Motivo" className="input !w-64" />
          <button className="btn btn-ghost btn-sm">Cerrar ese día</button>
        </form>
      )}
    </div>
  );
}
