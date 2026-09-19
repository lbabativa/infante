import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { get, getSetting, run, tx } from "./db";
import { getSlots, pickStaff } from "./availability";
import { normalizePhone } from "./format";
import { emitEvent, notifyClient, notifySalon } from "./notify";
import { getBooking, listServices, type BookingStatus } from "./repo";

export const bookingInput = z.object({
  locationId: z.coerce.number().int().positive(),
  serviceIds: z.array(z.coerce.number().int().positive()).min(1, "Elige al menos un servicio").max(6),
  staffId: z.coerce.number().int().positive().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start: z.coerce.number().int().min(0).max(1440),
  name: z.string().trim().min(2, "Escribe tu nombre").max(80),
  phone: z
    .string()
    .trim()
    .refine((p) => normalizePhone(p).length >= 11, "Número de celular no válido"),
  email: z.union([z.literal(""), z.string().trim().email("Correo no válido")]).optional(),
  notes: z.string().trim().max(500).optional(),
  source: z.enum(["web", "admin", "api", "novacall", "whatsapp"]).default("web"),
});

export type BookingInput = z.infer<typeof bookingInput>;

export class BookingError extends Error {}

function newCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  return "INF-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function upsertClient(name: string, rawPhone: string, email?: string) {
  const phone = normalizePhone(rawPhone);
  const existing = get<{ id: number }>("SELECT id FROM clients WHERE phone = ?", phone);
  if (existing) {
    run("UPDATE clients SET name = ?, email = COALESCE(NULLIF(?, ''), email) WHERE id = ?", name, email ?? "", existing.id);
    return existing.id;
  }
  return Number(run("INSERT INTO clients (name, phone, email) VALUES (?,?,?)", name, phone, email || null).lastInsertRowid);
}

export async function createBooking(input: BookingInput, opts: { force?: boolean } = {}) {
  const services = listServices({ includeInactive: true }).filter((s) => input.serviceIds.includes(s.id));
  if (services.length !== new Set(input.serviceIds).size) throw new BookingError("Servicio no disponible");
  const duration = services.reduce((a, s) => a + s.duration_min, 0);
  const total = services.every((s) => s.price != null) ? services.reduce((a, s) => a + (s.price ?? 0), 0) : null;

  const status: BookingStatus =
    input.source === "admin" || getSetting("auto_confirm") === "1" ? "confirmed" : "pending";

  const id = tx(() => {
    // Verificación dentro de la transacción: evita dobles reservas.
    const slot = getSlots({
      locationId: input.locationId,
      date: input.date,
      serviceIds: input.serviceIds,
      staffId: input.staffId,
      ignoreLeadTime: opts.force,
    }).find((s) => s.start === input.start);

    let staffId = input.staffId ?? null;
    if (!slot) {
      if (!(opts.force && staffId)) throw new BookingError("Ese horario acaba de ocuparse. Elige otro, por favor.");
    } else {
      staffId = staffId ?? pickStaff(input.date, slot.staffIds);
    }

    const clientId = upsertClient(input.name, input.phone, input.email);
    const bookingId = Number(
      run(
        `INSERT INTO bookings (code, location_id, staff_id, client_id, date, start_min, end_min, status, total_price, notes, source)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        newCode(),
        input.locationId,
        staffId,
        clientId,
        input.date,
        input.start,
        input.start + duration,
        status,
        total,
        input.notes || null,
        input.source
      ).lastInsertRowid
    );
    for (const s of services)
      run(
        "INSERT INTO booking_services (booking_id, service_id, name, price, duration_min) VALUES (?,?,?,?,?)",
        bookingId,
        s.id,
        s.name,
        s.price,
        s.duration_min
      );
    return bookingId;
  });

  await notifyClient(id, status === "confirmed" ? "tpl_confirmed" : "tpl_pending");
  if (input.source !== "admin") await notifySalon(id);
  await emitEvent("booking.created", id);
  return getBooking(id)!;
}

const STATUS_TEMPLATE: Partial<Record<BookingStatus, "tpl_confirmed" | "tpl_cancelled">> = {
  confirmed: "tpl_confirmed",
  cancelled: "tpl_cancelled",
};

export async function setBookingStatus(id: number, status: BookingStatus, opts: { notify?: boolean } = {}) {
  const before = getBooking(id);
  if (!before || before.status === status) return before;
  run("UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?", status, id);
  const tpl = STATUS_TEMPLATE[status];
  if (tpl && opts.notify !== false) await notifyClient(id, tpl);
  await emitEvent(`booking.${status}`, id);
  return getBooking(id);
}

export async function rescheduleBooking(id: number, date: string, start: number, staffId: number) {
  const b = getBooking(id);
  if (!b) throw new BookingError("Cita no encontrada");
  const duration = b.end_min - b.start_min;
  run(
    `UPDATE bookings SET date = ?, start_min = ?, end_min = ?, staff_id = ?, reminder_24_at = NULL, reminder_3_at = NULL,
     updated_at = datetime('now') WHERE id = ?`,
    date,
    start,
    start + duration,
    staffId,
    id
  );
  await notifyClient(id, "tpl_confirmed");
  await emitEvent("booking.rescheduled", id);
}
