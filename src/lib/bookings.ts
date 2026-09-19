import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { col, getSetting, nextId, nowIso, withLock } from "./db";
import { getSlots, pickStaff } from "./availability";
import { normalizePhone } from "./format";
import { emitEvent, notifyClient, notifySalon } from "./notify";
import { getBooking, listServices, type BookingDoc, type BookingStatus, type Client } from "./repo";

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
  return "INF-" + Array.from(randomBytes(6), (b) => alphabet[b % alphabet.length]).join("");
}

export async function upsertClient(name: string, rawPhone: string, email?: string) {
  const phone = normalizePhone(rawPhone);
  const clients = await col<Client>("clients");
  const existing = await clients.findOne({ phone });
  if (existing) {
    await clients.updateOne({ id: existing.id }, { $set: { name, ...(email ? { email } : {}) } });
    return existing.id;
  }
  const id = await nextId("clients");
  try {
    await clients.insertOne({ id, name, phone, email: email || null, notes: null, created_at: nowIso() });
    return id;
  } catch {
    // Otra petición creó el mismo celular en paralelo.
    return (await clients.findOne({ phone }))!.id;
  }
}

export async function createBooking(input: BookingInput, opts: { force?: boolean } = {}) {
  const services = (await listServices({ includeInactive: true })).filter((s) => input.serviceIds.includes(s.id));
  if (services.length !== new Set(input.serviceIds).size) throw new BookingError("Servicio no disponible");
  const duration = services.reduce((a, s) => a + s.duration_min, 0);
  const total = services.every((s) => s.price != null) ? services.reduce((a, s) => a + (s.price ?? 0), 0) : null;
  const status: BookingStatus = input.source === "admin" || (await getSetting("auto_confirm")) === "1" ? "confirmed" : "pending";
  const clientId = await upsertClient(input.name, input.phone, input.email);

  // Candado por sede y día: las reservas simultáneas del mismo día se serializan.
  const id = await withLock(`book:${input.locationId}:${input.date}`, async (session) => {
    const slot = (
      await getSlots(
        { locationId: input.locationId, date: input.date, serviceIds: input.serviceIds, staffId: input.staffId, ignoreLeadTime: opts.force },
        session
      )
    ).find((s) => s.start === input.start);

    let staffId = input.staffId ?? null;
    if (!slot) {
      if (!(opts.force && staffId)) throw new BookingError("Ese horario acaba de ocuparse. Elige otro, por favor.");
    } else {
      staffId = staffId ?? (await pickStaff(input.date, slot.staffIds, session));
    }

    const bookingId = await nextId("bookings");
    const now = nowIso();
    await (await col<BookingDoc>("bookings")).insertOne(
      {
        id: bookingId,
        code: newCode(),
        location_id: input.locationId,
        staff_id: staffId!,
        client_id: clientId,
        date: input.date,
        start_min: input.start,
        end_min: input.start + duration,
        status,
        total_price: total,
        notes: input.notes || null,
        source: input.source,
        services: services.map((s) => ({ service_id: s.id, name: s.name, price: s.price, duration_min: s.duration_min })),
        reminder_24_at: null,
        reminder_3_at: null,
        followup_at: null,
        created_at: now,
        updated_at: now,
      },
      { session }
    );
    return bookingId;
  });

  await notifyClient(id, status === "confirmed" ? "tpl_confirmed" : "tpl_pending");
  if (input.source !== "admin") await notifySalon(id);
  await emitEvent("booking.created", id);
  return (await getBooking(id))!;
}

const STATUS_TEMPLATE: Partial<Record<BookingStatus, "tpl_confirmed" | "tpl_cancelled">> = {
  confirmed: "tpl_confirmed",
  cancelled: "tpl_cancelled",
};

export async function setBookingStatus(id: number, status: BookingStatus, opts: { notify?: boolean } = {}) {
  const before = await getBooking(id);
  if (!before || before.status === status) return before;
  await (await col<BookingDoc>("bookings")).updateOne({ id }, { $set: { status, updated_at: nowIso() } });
  const tpl = STATUS_TEMPLATE[status];
  if (tpl && opts.notify !== false) await notifyClient(id, tpl);
  await emitEvent(`booking.${status}`, id);
  return getBooking(id);
}

export async function rescheduleBooking(id: number, date: string, start: number, staffId: number) {
  const b = await getBooking(id);
  if (!b) throw new BookingError("Cita no encontrada");
  await (await col<BookingDoc>("bookings")).updateOne(
    { id },
    {
      $set: {
        date,
        start_min: start,
        end_min: start + (b.end_min - b.start_min),
        staff_id: staffId,
        reminder_24_at: null,
        reminder_3_at: null,
        updated_at: nowIso(),
      },
    }
  );
  await notifyClient(id, "tpl_confirmed");
  await emitEvent("booking.rescheduled", id);
}
