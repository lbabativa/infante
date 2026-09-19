import Link from "next/link";
import { markMessageSent, runAutomationsNow, saveSettings } from "@/app/admin/actions";
import { Empty, PageTitle } from "@/components/admin/ui";
import { all, getSetting } from "@/lib/db";
import { prettyPhone } from "@/lib/format";
import { waLink } from "@/lib/notify";
import { defaultTemplates } from "@/lib/seed-data";

export const metadata = { title: "Mensajes" };

type Msg = { id: number; booking_id: number | null; channel: string; to_addr: string; template: string; body: string; status: string; provider: string | null; error: string | null; created_at: string };

const STATUS: Record<string, { label: string; cls: string }> = {
  sent: { label: "Enviado", cls: "bg-emerald-100 text-emerald-800" },
  manual: { label: "Por enviar", cls: "bg-amber-100 text-amber-800" },
  failed: { label: "Falló", cls: "bg-red-100 text-red-700" },
};

const VARS = ["{nombre}", "{servicios}", "{fecha}", "{hora}", "{especialista}", "{sede}", "{direccion}", "{link}", "{codigo}", "{reservar}", "{resena}"];

export default async function MensajesPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  const msgs = all<Msg>(`SELECT * FROM messages ${estado ? "WHERE status = ?" : ""} ORDER BY id DESC LIMIT 200`, ...(estado ? [estado] : []));
  const apiOn = !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

  return (
    <>
      <PageTitle title="Mensajes" sub="Confirmaciones, recordatorios y seguimientos automáticos por WhatsApp">
        <form action={runAutomationsNow}>
          <button className="btn btn-ghost">Revisar recordatorios ahora</button>
        </form>
      </PageTitle>

      <div className={`mb-6 rounded-xl p-4 text-sm ${apiOn ? "bg-emerald-50 text-emerald-900" : "bg-[#fbf6ee] text-[#5f4a2a]"}`}>
        {apiOn ? (
          <>✅ WhatsApp Business API conectada: los mensajes salen solos.</>
        ) : (
          <>
            <b>Modo asistido:</b> cada mensaje queda listo aquí con un botón “Enviar” que abre WhatsApp con el texto escrito — un clic y listo. Al conectar la
            API de WhatsApp Business (o NovaCall) el envío pasa a ser 100 % automático, sin cambiar nada más.
          </>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        {[
          ["", "Todos"],
          ["manual", "Por enviar"],
          ["sent", "Enviados"],
          ["failed", "Fallidos"],
        ].map(([k, v]) => (
          <Link key={k} href={k ? `/admin/mensajes?estado=${k}` : "/admin/mensajes"} className={`btn btn-sm ${estado === k || (!estado && !k) ? "" : "btn-ghost"}`}>
            {v}
          </Link>
        ))}
      </div>

      {msgs.length === 0 ? (
        <Empty>No hay mensajes {estado ? "con este estado" : "todavía"}.</Empty>
      ) : (
        <ul className="space-y-2">
          {msgs.map((m) => (
            <li key={m.id} className="card flex flex-wrap items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="mb-1 flex flex-wrap items-center gap-2 text-xs text-[#7a6f62]">
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${STATUS[m.status]?.cls}`}>{STATUS[m.status]?.label ?? m.status}</span>
                  <span>{defaultTemplates[m.template]?.label ?? m.template}</span>
                  <span>→ {m.channel === "whatsapp" ? prettyPhone(m.to_addr) : m.to_addr}</span>
                  <span>· {m.created_at.slice(0, 16)} UTC</span>
                  {m.booking_id && (
                    <Link href={`/admin/citas/${m.booking_id}`} className="underline">
                      ver cita
                    </Link>
                  )}
                </p>
                <p className="line-clamp-3 whitespace-pre-line text-sm">{m.body}</p>
                {m.error && <p className="mt-1 text-xs text-red-700">{m.error}</p>}
              </div>
              {m.status !== "sent" && m.channel === "whatsapp" && (
                <div className="flex gap-2">
                  <a href={waLink(m.to_addr, m.body)} target="_blank" rel="noreferrer" className="btn btn-sm !bg-[#1f9d55]">
                    Enviar por WhatsApp
                  </a>
                  <form action={markMessageSent}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="btn btn-ghost btn-sm">Marcar enviado</button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-2 mt-12 font-display text-3xl">Plantillas</h2>
      <p className="mb-4 text-sm text-[#7a6f62]">
        Variables disponibles: {VARS.map((v) => <code key={v} className="mx-0.5 rounded bg-white px-1 text-xs">{v}</code>)}
      </p>
      <form action={saveSettings} className="grid gap-4 lg:grid-cols-2">
        {Object.entries(defaultTemplates).map(([key, t]) => (
          <label key={key} className="field card p-4">
            {t.label}
            <textarea name={key} rows={7} defaultValue={getSetting(key)} className="input font-mono !text-xs" />
          </label>
        ))}
        <div className="lg:col-span-2">
          <button className="btn">Guardar plantillas</button>
        </div>
      </form>
    </>
  );
}
