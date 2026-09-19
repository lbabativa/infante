import { saveSettings } from "@/app/admin/actions";
import { PageTitle } from "@/components/admin/ui";
import { getSetting } from "@/lib/db";
import { SITE_URL } from "@/lib/notify";

export const metadata = { title: "Ajustes" };

export default function AjustesPage() {
  const integrations = [
    { name: "WhatsApp Business API", on: !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID), env: "WHATSAPP_TOKEN · WHATSAPP_PHONE_NUMBER_ID" },
    { name: "Correo (Resend)", on: !!process.env.RESEND_API_KEY, env: "RESEND_API_KEY" },
    { name: "NovaCall · webhook de eventos", on: !!process.env.NOVACALL_WEBHOOK_URL, env: "NOVACALL_WEBHOOK_URL" },
    { name: "API de integraciones (/api/v1)", on: !!process.env.INTEGRATION_API_KEY, env: "INTEGRATION_API_KEY" },
    { name: "Cron de recordatorios", on: !!process.env.CRON_SECRET, env: "CRON_SECRET" },
  ];
  const check = (k: string, label: string, hint?: string) => (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" name={k} defaultChecked={getSetting(k) === "1"} className="mt-1 accent-[#a8864f]" />
      <span>
        {label}
        {hint && <span className="block text-xs text-[#7a6f62]">{hint}</span>}
      </span>
    </label>
  );

  return (
    <>
      <PageTitle title="Ajustes" />
      <div className="grid gap-6 lg:grid-cols-2">
        <form action={saveSettings} className="card space-y-5 p-5">
          <input type="hidden" name="_checkboxes" value="1" />
          <h2 className="font-semibold">Reservas</h2>
          {check("auto_confirm", "Confirmar automáticamente las reservas web", "Si lo desactivas, quedan “por confirmar” hasta que alguien las apruebe.")}
          <div className="grid grid-cols-3 gap-3">
            <label className="field">
              Intervalo de horarios
              <select name="slot_step" defaultValue={getSetting("slot_step")} className="input">
                {["15", "30", "60"].map((v) => (
                  <option key={v} value={v}>
                    {v} min
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Anticipación mínima (min)
              <input name="lead_minutes" type="number" defaultValue={getSetting("lead_minutes")} className="input" />
            </label>
            <label className="field">
              Reservar hasta (días)
              <input name="max_days_ahead" type="number" defaultValue={getSetting("max_days_ahead")} className="input" />
            </label>
          </div>
          <h2 className="pt-2 font-semibold">Automatizaciones</h2>
          {check("reminder_24h", "Recordatorio 24 horas antes")}
          {check("reminder_3h", "Recordatorio el mismo día (3 horas antes)")}
          {check("followup", "Agradecimiento + pedir reseña después de la visita")}
          <h2 className="pt-2 font-semibold">Contacto</h2>
          <label className="field">
            WhatsApp del salón (recibe avisos de nuevas citas)
            <input name="salon_whatsapp" defaultValue={getSetting("salon_whatsapp")} className="input" />
          </label>
          <label className="field">
            Enlace para reseñas (Google)
            <input name="review_url" defaultValue={getSetting("review_url")} className="input" />
          </label>
          <label className="field">
            Instagram
            <input name="instagram_url" defaultValue={getSetting("instagram_url")} className="input" />
          </label>
          <button className="btn">Guardar ajustes</button>
        </form>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Integraciones</h2>
            <ul className="space-y-3 text-sm">
              {integrations.map((i) => (
                <li key={i.name} className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${i.on ? "bg-emerald-500" : "bg-stone-300"}`} />
                  <span>
                    {i.name} <span className="text-xs text-[#7a6f62]">{i.on ? "· conectado" : "· sin configurar"}</span>
                    <code className="block text-[0.68rem] text-[#9a8f80]">{i.env}</code>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="card space-y-3 p-5 text-sm">
            <h2 className="font-semibold">Listo para NovaCall</h2>
            <p className="text-[#5f564b]">
              El agente de voz puede consultar disponibilidad y agendar/cancelar citas en nombre del salón con la API de integraciones
              (encabezado <code>Authorization: Bearer INTEGRATION_API_KEY</code>):
            </p>
            <ul className="space-y-1 font-mono text-xs">
              <li>GET {SITE_URL}/api/v1/catalog</li>
              <li>GET {SITE_URL}/api/v1/availability?services=1,2&date=AAAA-MM-DD</li>
              <li>POST {SITE_URL}/api/v1/bookings</li>
              <li>POST {SITE_URL}/api/v1/bookings/CODIGO/cancel</li>
            </ul>
            <p className="text-[#5f564b]">
              Y cada cambio de cita se notifica a <code>NOVACALL_WEBHOOK_URL</code> (booking.created, booking.cancelled, booking.rescheduled…).
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
