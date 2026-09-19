import "server-only";
import { all, getSetting } from "./db";
import { bogotaNow, weekday, addDays } from "./format";
import { getLocation, listServices, listStaff, staffCanDo, type Staff } from "./repo";

export type Slot = { start: number; staffIds: number[] };

type Interval = [number, number];

function busyFor(date: string, staffIds: number[], locationId: number, ignoreBookingId?: number) {
  const bookings = all<{ staff_id: number; start_min: number; end_min: number; id: number }>(
    `SELECT id, staff_id, start_min, end_min FROM bookings
     WHERE date = ? AND status IN ('pending','confirmed')`,
    date
  ).filter((b) => b.id !== ignoreBookingId);
  const off = all<{ staff_id: number | null; location_id: number | null; start_min: number; end_min: number }>(
    "SELECT staff_id, location_id, start_min, end_min FROM time_off WHERE date = ?",
    date
  );
  const map = new Map<number, Interval[]>();
  for (const id of staffIds) {
    map.set(id, [
      ...bookings.filter((b) => b.staff_id === id).map((b) => [b.start_min, b.end_min] as Interval),
      ...off
        .filter((o) => o.staff_id === id || (o.staff_id == null && (o.location_id == null || o.location_id === locationId)))
        .map((o) => [o.start_min, o.end_min] as Interval),
    ]);
  }
  return map;
}

export function totalDuration(serviceIds: number[]) {
  const services = listServices({ includeInactive: true });
  return serviceIds.reduce((acc, id) => acc + (services.find((s) => s.id === id)?.duration_min ?? 0), 0);
}

export function candidateStaff(locationId: number, serviceIds: number[], staffId?: number | null): Staff[] {
  return listStaff().filter(
    (s) =>
      s.bookable &&
      (s.location_id == null || s.location_id === locationId) &&
      staffCanDo(s, serviceIds) &&
      (!staffId || s.id === staffId)
  );
}

/** Horarios disponibles para una fecha. Cada slot lista qué especialistas pueden atenderlo. */
export function getSlots(opts: {
  locationId: number;
  date: string;
  serviceIds: number[];
  staffId?: number | null;
  ignoreBookingId?: number;
  ignoreLeadTime?: boolean;
}): Slot[] {
  const location = getLocation(opts.locationId);
  if (!location || !location.active) return [];
  const wd = weekday(opts.date);
  const open = location.hours[wd];
  if (!open) return [];

  const now = bogotaNow();
  const maxDate = addDays(now.date, Number(getSetting("max_days_ahead")) || 60);
  if (!opts.ignoreLeadTime && (opts.date < now.date || opts.date > maxDate)) return [];

  const dur = totalDuration(opts.serviceIds);
  if (!dur) return [];
  const step = Number(getSetting("slot_step")) || 30;
  const earliest =
    !opts.ignoreLeadTime && opts.date === now.date ? now.minutes + (Number(getSetting("lead_minutes")) || 0) : 0;

  const staff = candidateStaff(opts.locationId, opts.serviceIds, opts.staffId);
  const busy = busyFor(opts.date, staff.map((s) => s.id), opts.locationId, opts.ignoreBookingId);

  const slots: Slot[] = [];
  for (let t = open[0]; t + dur <= open[1]; t += step) {
    if (t < earliest) continue;
    const ids = staff
      .filter((s) => {
        const w = s.schedule[wd];
        if (!w || t < Math.max(w[0], open[0]) || t + dur > Math.min(w[1], open[1])) return false;
        return !(busy.get(s.id) ?? []).some(([a, b]) => t < b && t + dur > a);
      })
      .map((s) => s.id);
    if (ids.length) slots.push({ start: t, staffIds: ids });
  }
  return slots;
}

/** Días con al menos un horario libre (para pintar el calendario). */
export function availableDays(opts: { locationId: number; serviceIds: number[]; staffId?: number | null; days?: number }) {
  const now = bogotaNow();
  const out: { date: string; count: number }[] = [];
  for (let i = 0; i < (opts.days ?? 21); i++) {
    const date = addDays(now.date, i);
    out.push({ date, count: getSlots({ ...opts, date }).length });
  }
  return out;
}

/** Cuando el cliente elige "sin preferencia": el especialista con menos citas ese día. */
export function pickStaff(date: string, staffIds: number[]) {
  const load = all<{ staff_id: number; n: number }>(
    `SELECT staff_id, COUNT(*) AS n FROM bookings WHERE date = ? AND status IN ('pending','confirmed') GROUP BY staff_id`,
    date
  );
  return [...staffIds].sort(
    (a, b) => (load.find((l) => l.staff_id === a)?.n ?? 0) - (load.find((l) => l.staff_id === b)?.n ?? 0)
  )[0];
}
