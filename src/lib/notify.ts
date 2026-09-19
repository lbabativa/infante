import "server-only";
import { all, get, getSetting, run } from "./db";
import { addDays, bogotaNow, clock, longDate, prettyPhone } from "./format";
import { getBooking, type Booking } from "./repo";
import { defaultTemplates } from "./seed-data";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export type TemplateKey = keyof typeof defaultTemplates;

export function renderTemplate(key: TemplateKey, b: Booking) {
  const vars: Record<string, string> = {
    nombre: b.client_name.split(" ")[0],
    cliente: b.client_name,
    telefono: prettyPhone(b.client_phone),
    servicios: b.services.map((s) => s.name).join(" + "),
    fecha: longDate(b.date),
    hora: clock(b.start_min),
    especialista: b.staff_name,
    sede: b.location_name,
    direccion: b.location_address,
    codigo: b.code,
    origen: b.source,
    link: `${SITE_URL}/reserva/${b.code}`,
    reservar: `${SITE_URL}/reservar`,
    resena: getSetting("review_url"),
  };
  return getSetting(key).replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
}

export function waLink(phone: string, text: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

type SendResult = { status: "sent" | "manual" | "failed"; provider: string; error?: string };

async function sendWhatsApp(to: string, body: string): Promise<SendResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { status: "manual", provider: "wa.me" };
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body, preview_url: true } }),
    });
    if (!res.ok) return { status: "failed", provider: "whatsapp-cloud", error: (await res.text()).slice(0, 500) };
    return { status: "sent", provider: "whatsapp-cloud" };
  } catch (e) {
    return { status: "failed", provider: "whatsapp-cloud", error: String(e) };
  }
}

async function sendEmail(to: string, subject: string, body: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { status: "manual", provider: "none" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Infante Hair Stylist <onboarding@resend.dev>",
        to,
        subject,
        text: body.replace(/\*/g, ""),
      }),
    });
    if (!res.ok) return { status: "failed", provider: "resend", error: (await res.text()).slice(0, 500) };
    return { status: "sent", provider: "resend" };
  } catch (e) {
    return { status: "failed", provider: "resend", error: String(e) };
  }
}

const SUBJECTS: Partial<Record<TemplateKey, string>> = {
  tpl_confirmed: "Tu cita en Infante está confirmada",
  tpl_pending: "Recibimos tu solicitud de cita",
  tpl_cancelled: "Tu cita fue cancelada",
  tpl_reminder_24h: "Recordatorio: tu cita es mañana",
  tpl_reminder_3h: "Hoy es tu cita en Infante",
  tpl_followup: "Gracias por visitarnos",
};

/** Envía una plantilla al cliente (WhatsApp + correo si hay) y la registra en la bandeja de mensajes. */
export async function notifyClient(bookingId: number, key: TemplateKey) {
  const b = getBooking(bookingId);
  if (!b) return;
  const body = renderTemplate(key, b);
  const wa = await sendWhatsApp(b.client_phone, body);
  log(b.id, "whatsapp", b.client_phone, key, body, wa);
  if (b.client_email && process.env.RESEND_API_KEY) {
    const em = await sendEmail(b.client_email, SUBJECTS[key] ?? "Infante Hair Stylist", body);
    log(b.id, "email", b.client_email, key, body, em);
  }
}

/** Aviso interno al WhatsApp del salón. */
export async function notifySalon(bookingId: number) {
  const b = getBooking(bookingId);
  const to = getSetting("salon_whatsapp");
  if (!b || !to) return;
  const body = renderTemplate("tpl_staff_new", b);
  log(b.id, "whatsapp", to, "tpl_staff_new", body, await sendWhatsApp(to, body));
}

function log(bookingId: number, channel: string, to: string, tpl: string, body: string, r: SendResult) {
  run(
    `INSERT INTO messages (booking_id, channel, to_addr, template, body, status, provider, error, sent_at)
     VALUES (?,?,?,?,?,?,?,?, CASE WHEN ? = 'sent' THEN datetime('now') END)`,
    bookingId,
    channel,
    to,
    tpl,
    body,
    r.status,
    r.provider,
    r.error ?? null,
    r.status
  );
}

/** Evento saliente para NovaCall (u otro sistema) — se activa con NOVACALL_WEBHOOK_URL. */
export async function emitEvent(event: string, bookingId: number) {
  const url = process.env.NOVACALL_WEBHOOK_URL;
  if (!url) return;
  const b = getBooking(bookingId);
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, at: new Date().toISOString(), booking: b }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (e) {
    console.error("[novacall] webhook falló", e);
  }
}

/**
 * Recordatorios y seguimientos automáticos. Idempotente: marca cada cita al enviar.
 * Se ejecuta por cron (/api/cron/recordatorios) y también al abrir el panel admin.
 */
export async function runAutomations() {
  const now = bogotaNow();
  const tomorrow = addDays(now.date, 1);
  const sent = { reminder24: 0, reminder3: 0, followup: 0 };

  if (getSetting("reminder_24h") === "1") {
    // Citas de mañana, desde que falten ≤ 24 h
    const rows = all<{ id: number }>(
      `SELECT id FROM bookings WHERE status IN ('confirmed','pending') AND reminder_24_at IS NULL
       AND date = ? AND start_min <= ? AND created_at <= datetime('now','-6 hours')`,
      tomorrow,
      now.minutes
    );
    for (const r of rows) {
      run("UPDATE bookings SET reminder_24_at = datetime('now') WHERE id = ?", r.id);
      await notifyClient(r.id, "tpl_reminder_24h");
      sent.reminder24++;
    }
  }

  if (getSetting("reminder_3h") === "1") {
    const rows = all<{ id: number }>(
      `SELECT id FROM bookings WHERE status = 'confirmed' AND reminder_3_at IS NULL
       AND date = ? AND start_min > ? AND start_min <= ? AND created_at <= datetime('now','-2 hours')`,
      now.date,
      now.minutes,
      now.minutes + 180
    );
    for (const r of rows) {
      run("UPDATE bookings SET reminder_3_at = datetime('now') WHERE id = ?", r.id);
      await notifyClient(r.id, "tpl_reminder_3h");
      sent.reminder3++;
    }
  }

  if (getSetting("followup") === "1") {
    const rows = all<{ id: number }>(
      `SELECT id FROM bookings WHERE status = 'completed' AND followup_at IS NULL
       AND (date < ? OR (date = ? AND end_min + 60 <= ?)) AND date >= ?`,
      now.date,
      now.date,
      now.minutes,
      addDays(now.date, -3)
    );
    for (const r of rows) {
      run("UPDATE bookings SET followup_at = datetime('now') WHERE id = ?", r.id);
      await notifyClient(r.id, "tpl_followup");
      sent.followup++;
    }
  }
  return sent;
}

export function pendingManualCount() {
  return get<{ n: number }>("SELECT COUNT(*) AS n FROM messages WHERE status = 'manual'")?.n ?? 0;
}
