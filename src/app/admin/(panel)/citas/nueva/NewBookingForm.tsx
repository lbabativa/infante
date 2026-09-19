"use client";
import { useActionState, useState } from "react";
import { createAdminBooking } from "@/app/admin/actions";

type Cat = { id: number; name: string; services: { id: number; name: string; duration: number }[] };

export function NewBookingForm({
  categories,
  staff,
  locations,
  defaults,
}: {
  categories: Cat[];
  staff: { id: number; name: string }[];
  locations: { id: number; name: string }[];
  defaults: { date: string; time: string; staffId: string };
}) {
  const [state, action, pending] = useActionState(createAdminBooking, {});
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const all = categories.flatMap((c) => c.services);
  const total = all.filter((s) => picked.includes(s.id)).reduce((a, s) => a + s.duration, 0);

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">Cliente</h2>
        <label className="field">
          Nombre *
          <input name="name" required className="input" />
        </label>
        <label className="field">
          Celular (WhatsApp) *
          <input name="phone" type="tel" required className="input" placeholder="300 123 4567" />
        </label>
        <label className="field">
          Correo
          <input name="email" type="email" className="input" />
        </label>

        <h2 className="pt-2 font-semibold">Cuándo y con quién</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="field">
            Fecha *
            <input type="date" name="date" defaultValue={defaults.date} required className="input" />
          </label>
          <label className="field">
            Hora *
            <input type="time" name="time" step={900} defaultValue={defaults.time} required className="input" />
          </label>
          <label className="field">
            Especialista
            <select name="staffId" defaultValue={defaults.staffId} className="input">
              <option value="">Asignar automáticamente</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Sede
            <select name="locationId" className="input">
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          Notas
          <textarea name="notes" rows={2} className="input" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="force" className="accent-[#a8864f]" /> Forzar (agendar aunque el horario figure ocupado)
        </label>
        {state.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
        <button className="btn w-full justify-center py-3" disabled={pending || !picked.length}>
          {pending ? "Guardando…" : `Crear cita${total ? ` · ${total} min` : ""}`}
        </button>
        <p className="text-xs text-[#7a6f62]">Al crearla se envía la confirmación por WhatsApp al cliente.</p>
      </section>

      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold">Servicios *</h2>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="input !w-48 !py-1" />
        </div>
        <div className="max-h-[36rem] space-y-5 overflow-y-auto pr-2">
          {categories.map((c) => {
            const items = c.services.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
            if (!items.length) return null;
            return (
              <div key={c.id}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#a8864f]">{c.name}</p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {items.map((s) => (
                    <label key={s.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${picked.includes(s.id) ? "border-[#a8864f] bg-[#fbf6ee]" : "border-[#efe8dd]"}`}>
                      <input
                        type="checkbox"
                        name="serviceIds"
                        value={s.id}
                        checked={picked.includes(s.id)}
                        onChange={(e) => setPicked((p) => (e.target.checked ? [...p, s.id] : p.filter((x) => x !== s.id)))}
                        className="accent-[#a8864f]"
                      />
                      <span className="flex-1">{s.name}</span>
                      <span className="text-xs text-[#9a8f80]">{s.duration}′</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </form>
  );
}
