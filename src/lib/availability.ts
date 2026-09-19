import "server-only";
import type { ClientSession } from "mongodb";
import { col, getSettings, NO_ID } from "./db";
import { bogotaNow, weekday, addDays } from "./format";
import { getLocation, listServices, listStaff, staffCanDo, type BookingDoc, type Location, type Staff, type TimeOff } from "./repo";

export type Slot = { start: number; staffIds: number[] };

type Interval = [number, number];

async function busyFor(dates: string[], ignoreBookingId?: number, session?: ClientSession) {
  const [bookings, off] = await Promise.all([
    (await col<BookingDoc>("bookings"))
      .find({ date: { $in: dates }, status: { $in: ["pending", "confirmed"] } }, { ...NO_ID, session })
      .toArray(),
    (await col<TimeOff>("time_off")).find({ date: { $in: dates } }, { ...NO_ID, session }).toArray(),
  ]);
  return { bookings: bookings.filter((b) => b.id !== ignoreBookingId), off };
}

export async function totalDuration(serviceIds: number[]) {
  const services = await listServices({ includeInactive: true });
  return serviceIds.reduce((acc, id) => acc + (services.find((s) => s.id === id)?.duration_min ?? 0), 0);
}

export async function candidateStaff(locationId: number, serviceIds: number[], staffId?: number | null): Promise<Staff[]> {
  return (await listStaff()).filter(
    (s) =>
      s.bookable && (s.location_id == null || s.location_id === locationId) && staffCanDo(s, serviceIds) && (!staffId || s.id === staffId)
  );
}

type Ctx = {
  location: Location;
  staff: Staff[];
  duration: number;
  step: number;
  lead: number;
  maxDate: string;
  busy: Awaited<ReturnType<typeof busyFor>>;
};

function slotsForDay(ctx: Ctx, date: string, ignoreLeadTime?: boolean): Slot[] {
  const wd = weekday(date);
  const open = ctx.location.hours[wd];
  if (!open) return [];
  const now = bogotaNow();
  if (!ignoreLeadTime && (date < now.date || date > ctx.maxDate)) return [];
  const earliest = !ignoreLeadTime && date === now.date ? now.minutes + ctx.lead : 0;

  const busy = new Map<number, Interval[]>();
  for (const s of ctx.staff) {
    busy.set(s.id, [
      ...ctx.busy.bookings.filter((b) => b.date === date && b.staff_id === s.id).map((b) => [b.start_min, b.end_min] as Interval),
      ...ctx.busy.off
        .filter(
          (o) =>
            o.date === date && (o.staff_id === s.id || (o.staff_id == null && (o.location_id == null || o.location_id === ctx.location.id)))
        )
        .map((o) => [o.start_min, o.end_min] as Interval),
    ]);
  }

  const slots: Slot[] = [];
  for (let t = open[0]; t + ctx.duration <= open[1]; t += ctx.step) {
    if (t < earliest) continue;
    const ids = ctx.staff
      .filter((s) => {
        const w = s.schedule[wd];
        if (!w || t < Math.max(w[0], open[0]) || t + ctx.duration > Math.min(w[1], open[1])) return false;
        return !(busy.get(s.id) ?? []).some(([a, b]) => t < b && t + ctx.duration > a);
      })
      .map((s) => s.id);
    if (ids.length) slots.push({ start: t, staffIds: ids });
  }
  return slots;
}

async function context(
  opts: { locationId: number; serviceIds: number[]; staffId?: number | null; ignoreBookingId?: number },
  dates: string[],
  session?: ClientSession
): Promise<Ctx | null> {
  const location = await getLocation(opts.locationId);
  if (!location || !location.active) return null;
  const [settings, duration, staff, busy] = await Promise.all([
    getSettings(),
    totalDuration(opts.serviceIds),
    candidateStaff(opts.locationId, opts.serviceIds, opts.staffId),
    busyFor(dates, opts.ignoreBookingId, session),
  ]);
  if (!duration) return null;
  return {
    location,
    staff,
    duration,
    busy,
    step: Number(settings.slot_step) || 30,
    lead: Number(settings.lead_minutes) || 0,
    maxDate: addDays(bogotaNow().date, Number(settings.max_days_ahead) || 60),
  };
}

/** Horarios disponibles para una fecha. Cada slot lista qué especialistas pueden atenderlo. */
export async function getSlots(
  opts: {
    locationId: number;
    date: string;
    serviceIds: number[];
    staffId?: number | null;
    ignoreBookingId?: number;
    ignoreLeadTime?: boolean;
  },
  session?: ClientSession
): Promise<Slot[]> {
  const ctx = await context(opts, [opts.date], session);
  return ctx ? slotsForDay(ctx, opts.date, opts.ignoreLeadTime) : [];
}

/** Días con al menos un horario libre (para pintar el calendario). Una sola consulta para todo el rango. */
export async function availableDays(opts: { locationId: number; serviceIds: number[]; staffId?: number | null; days?: number }) {
  const now = bogotaNow();
  const dates = Array.from({ length: opts.days ?? 21 }, (_, i) => addDays(now.date, i));
  const ctx = await context(opts, dates);
  return dates.map((date) => ({ date, count: ctx ? slotsForDay(ctx, date).length : 0 }));
}

/** Cuando el cliente elige "sin preferencia": el especialista con menos citas ese día. */
export async function pickStaff(date: string, staffIds: number[], session?: ClientSession) {
  const rows = await (await col<BookingDoc>("bookings"))
    .find({ date, status: { $in: ["pending", "confirmed"] } }, { projection: { staff_id: 1 }, session })
    .toArray();
  const load = (id: number) => rows.filter((r) => r.staff_id === id).length;
  return [...staffIds].sort((a, b) => load(a) - load(b))[0];
}
