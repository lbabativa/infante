import "server-only";
import { col, getSettings, nextId, nowIso } from "./db";
import { addDays, bogotaNow, clock, longDate, prettyPhone } from "./format";
import { getBooking, type Booking, type BookingDoc } from "./repo";
import { defaultTemplates } from "./seed-data";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export type TemplateKey = keyof typeof defaultTemplates;

export type Message = {
  id: number;
  booking_id: number | null;
  channel: string;
  to_addr: string;
  template: string;
  body: string;
  status: "sent" | "manual" | "failed";
  provider: string | null;
  error: string | null;
  created_at: string;
  sent_at: string | null;
};

export async function renderTemplate(key: TemplateKey, b: Booking) {
  const settings = await getSettings();
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
    resena: settings.review_url,
  };
  return settings[key].replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
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
  const b = await getBooking(bookingId);
  if (!b) return;
  const body = await renderTemplate(key, b);
  await log(b.id, "whatsapp", b.client_phone, key, body, await sendWhatsApp(b.client_phone, body));
  if (b.client_email && process.env.RESEND_API_KEY) {
    await log(b.id, "email", b.client_email, key, body, await sendEmail(b.client_email, SUBJECTS[key] ?? "Infante Hair Stylist", body));
  }
}

/** Aviso interno al WhatsApp del salón. */
export async function notifySalon(bookingId: number) {
  const [b, settings] = await Promise.all([getBooking(bookingId), getSettings()]);
  const to = settings.salon_whatsapp;
  if (!b || !to) return;
  const body = await renderTemplate("tpl_staff_new", b);
  await log(b.id, "whatsapp", to, "tpl_staff_new", body, await sendWhatsApp(to, body));
}

async function log(bookingId: number, channel: string, to: string, tpl: string, body: string, r: SendResult) {
  const now = nowIso();
  await (await col<Message>("messages")).insertOne({
    id: await nextId("messages"),
    booking_id: bookingId,
    channel,
    to_addr: to,
    template: tpl,
    body,
    status: r.status,
    provider: r.provider,
    error: r.error ?? null,
    created_at: now,
    sent_at: r.status === "sent" ? now : null,
  });
}

/** Evento saliente para NovaCall (u otro sistema) — se activa con NOVACALL_WEBHOOK_URL. */
export async function emitEvent(event: string, bookingId: number) {
  const url = process.env.NOVACALL_WEBHOOK_URL;
  if (!url) return;
  const b = await getBooking(bookingId);
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

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

/**
 * Recordatorios y seguimientos automáticos. Idempotente: cada cita se "reclama" con una
 * actualización condicional antes de enviar, así dos ejecuciones simultáneas no duplican mensajes.
 * Se ejecuta por cron (/api/cron/recordatorios) y también al abrir el panel admin.
 */
export async function runAutomations() {
  const now = bogotaNow();
  const settings = await getSettings();
  const bookings = await col<BookingDoc>("bookings");
  const sent = { reminder24: 0, reminder3: 0, followup: 0 };

  async function claimAndSend(filter: Record<string, unknown>, field: "reminder_24_at" | "reminder_3_at" | "followup_at", tpl: TemplateKey) {
    let n = 0;
    for (const b of await bookings.find({ ...filter, [field]: null }, { projection: { id: 1 } }).toArray()) {
      const claim = await bookings.updateOne({ id: b.id, [field]: null }, { $set: { [field]: nowIso() } });
      if (claim.modifiedCount) {
        await notifyClient(b.id, tpl);
        n++;
      }
    }
    return n;
  }

  if (settings.reminder_24h === "1") {
    // Citas de mañana, desde que falten ≤ 24 h (no a las recién creadas: ya recibieron su confirmación).
    sent.reminder24 = await claimAndSend(
      { status: { $in: ["confirmed", "pending"] }, date: addDays(now.date, 1), start_min: { $lte: now.minutes }, created_at: { $lte: hoursAgo(6) } },
      "reminder_24_at",
      "tpl_reminder_24h"
    );
  }
  if (settings.reminder_3h === "1") {
    sent.reminder3 = await claimAndSend(
      { status: "confirmed", date: now.date, start_min: { $gt: now.minutes, $lte: now.minutes + 180 }, created_at: { $lte: hoursAgo(2) } },
      "reminder_3_at",
      "tpl_reminder_3h"
    );
  }
  if (settings.followup === "1") {
    sent.followup = await claimAndSend(
      {
        status: "completed",
        date: { $gte: addDays(now.date, -3), $lte: now.date },
        $or: [{ date: { $lt: now.date } }, { end_min: { $lte: now.minutes - 60 } }],
      },
      "followup_at",
      "tpl_followup"
    );
  }
  return sent;
}

export async function pendingManualCount() {
  return (await col<Message>("messages")).countDocuments({ status: "manual" });
}
