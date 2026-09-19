import "server-only";
import type { Filter } from "mongodb";
import { col, NO_ID } from "./db";

export type Hours = Record<number, [number, number] | null>;

export type Location = {
  id: number;
  slug: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  whatsapp: string | null;
  maps_url: string | null;
  hours: Hours;
  active: number;
  coming_soon: number;
  sort: number;
};

export type Category = { id: number; slug: string; name: string; tagline: string | null; sort: number };

export type Service = {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  duration_min: number;
  price: number | null;
  price_from: number;
  featured: number;
  active: number;
  sort: number;
};

export type Staff = {
  id: number;
  slug: string;
  name: string;
  role: string | null;
  bio: string | null;
  photo_url: string | null;
  instagram: string | null;
  phone: string | null;
  location_id: number | null;
  schedule: Hours;
  active: number;
  bookable: number;
  sort: number;
  service_ids: number[]; // vacío = realiza todos los servicios
};

export type Client = { id: number; name: string; phone: string; email: string | null; notes: string | null; created_at: string };

export type TimeOff = { id: number; staff_id: number | null; location_id: number | null; date: string; start_min: number; end_min: number; reason: string | null };

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

export type BookingService = { service_id: number | null; name: string; price: number | null; duration_min: number };

/** Documento tal como se guarda en la colección `bookings`. */
export type BookingDoc = {
  id: number;
  code: string;
  location_id: number;
  staff_id: number;
  client_id: number;
  date: string;
  start_min: number;
  end_min: number;
  status: BookingStatus;
  total_price: number | null;
  notes: string | null;
  source: string;
  services: BookingService[];
  reminder_24_at: string | null;
  reminder_3_at: string | null;
  followup_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Cita con los datos del cliente, especialista y sede resueltos. */
export type Booking = BookingDoc & {
  client_name: string;
  client_phone: string;
  client_email: string | null;
  staff_name: string;
  location_name: string;
  location_address: string;
};

const bySort = <T extends { sort: number; id: number }>(a: T, b: T) => a.sort - b.sort || a.id - b.id;

export async function listLocations(opts: { includeInactive?: boolean } = {}): Promise<Location[]> {
  const filter: Filter<Location> = opts.includeInactive ? {} : { $or: [{ active: 1 }, { coming_soon: 1 }] };
  return (await (await col<Location>("locations")).find(filter, NO_ID).toArray()).sort(bySort);
}
export async function getLocation(id: number) {
  return (await (await col<Location>("locations")).findOne({ id }, NO_ID)) ?? undefined;
}

export async function listCategories(): Promise<Category[]> {
  return (await (await col<Category>("categories")).find({}, NO_ID).toArray()).sort(bySort);
}

export async function listServices(opts: { includeInactive?: boolean } = {}): Promise<Service[]> {
  const [cats, services] = await Promise.all([
    listCategories(),
    (await col<Service>("services")).find(opts.includeInactive ? {} : { active: 1 }, NO_ID).toArray(),
  ]);
  const catOrder = new Map(cats.map((c, i) => [c.id, i]));
  return services.sort((a, b) => (catOrder.get(a.category_id) ?? 99) - (catOrder.get(b.category_id) ?? 99) || bySort(a, b));
}

export async function catalog() {
  const [categories, services] = await Promise.all([listCategories(), listServices()]);
  return categories.map((c) => ({ ...c, services: services.filter((s) => s.category_id === c.id) })).filter((c) => c.services.length);
}

export async function listStaff(opts: { includeInactive?: boolean } = {}): Promise<Staff[]> {
  const rows = await (await col<Staff>("staff")).find(opts.includeInactive ? {} : { active: 1 }, NO_ID).toArray();
  return rows.map((r) => ({ ...r, service_ids: r.service_ids ?? [] })).sort(bySort);
}
export async function getStaff(id: number) {
  const r = await (await col<Staff>("staff")).findOne({ id }, NO_ID);
  return r ? { ...r, service_ids: r.service_ids ?? [] } : undefined;
}

export function staffCanDo(staff: Staff, serviceIds: number[]) {
  return staff.service_ids.length === 0 || serviceIds.every((id) => staff.service_ids.includes(id));
}

export async function getClient(id: number) {
  return (await (await col<Client>("clients")).findOne({ id }, NO_ID)) ?? undefined;
}

/** Resuelve cliente, especialista y sede para una lista de citas (equivalente a los JOIN). */
async function hydrate(docs: BookingDoc[]): Promise<Booking[]> {
  if (!docs.length) return [];
  const [clients, staff, locations] = await Promise.all([
    (await col<Client>("clients")).find({ id: { $in: [...new Set(docs.map((d) => d.client_id))] } }, NO_ID).toArray(),
    (await col<Staff>("staff")).find({ id: { $in: [...new Set(docs.map((d) => d.staff_id))] } }, NO_ID).toArray(),
    (await col<Location>("locations")).find({ id: { $in: [...new Set(docs.map((d) => d.location_id))] } }, NO_ID).toArray(),
  ]);
  return docs.map((d) => {
    const c = clients.find((x) => x.id === d.client_id);
    const s = staff.find((x) => x.id === d.staff_id);
    const l = locations.find((x) => x.id === d.location_id);
    return {
      ...d,
      services: d.services ?? [],
      client_name: c?.name ?? "—",
      client_phone: c?.phone ?? "",
      client_email: c?.email ?? null,
      staff_name: s?.name ?? "—",
      location_name: l?.name ?? "—",
      location_address: l?.address ?? "",
    };
  });
}

export async function getBookingByCode(code: string): Promise<Booking | undefined> {
  const d = await (await col<BookingDoc>("bookings")).findOne({ code: code.toUpperCase() }, NO_ID);
  return d ? (await hydrate([d]))[0] : undefined;
}
export async function getBooking(id: number): Promise<Booking | undefined> {
  const d = await (await col<BookingDoc>("bookings")).findOne({ id }, NO_ID);
  return d ? (await hydrate([d]))[0] : undefined;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function listBookings(f: {
  from?: string;
  to?: string;
  status?: string;
  staffId?: number;
  locationId?: number;
  clientId?: number;
  q?: string;
  limit?: number;
  order?: "asc" | "desc";
}): Promise<Booking[]> {
  const filter: Filter<BookingDoc> = {};
  if (f.from || f.to) filter.date = { ...(f.from && { $gte: f.from }), ...(f.to && { $lte: f.to }) };
  if (f.status) filter.status = f.status as BookingStatus;
  if (f.staffId) filter.staff_id = f.staffId;
  if (f.locationId) filter.location_id = f.locationId;
  if (f.clientId) filter.client_id = f.clientId;
  if (f.q) {
    const re = new RegExp(escapeRe(f.q), "i");
    const ids = (await (await col<Client>("clients")).find({ $or: [{ name: re }, { phone: re }] }, { projection: { id: 1 } }).toArray()).map((c) => c.id);
    filter.$or = [{ client_id: { $in: ids } }, { code: new RegExp(escapeRe(f.q.toUpperCase())) }];
  }
  const dir = f.order === "desc" ? -1 : 1;
  const docs = await (await col<BookingDoc>("bookings"))
    .find(filter, NO_ID)
    .sort({ date: dir, start_min: dir })
    .limit(f.limit ?? 500)
    .toArray();
  return hydrate(docs);
}

export async function listTimeOff(filter: Filter<TimeOff>) {
  return (await col<TimeOff>("time_off")).find(filter, NO_ID).sort({ date: 1, start_min: 1 }).toArray();
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Por confirmar",
  confirmed: "Confirmada",
  completed: "Atendida",
  cancelled: "Cancelada",
  no_show: "No asistió",
};
