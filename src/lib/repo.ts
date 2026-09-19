import "server-only";
import { all, get } from "./db";

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

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

export type Booking = {
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
  created_at: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  staff_name: string;
  location_name: string;
  location_address: string;
  services: { service_id: number | null; name: string; price: number | null; duration_min: number }[];
};

type RawLocation = Omit<Location, "hours"> & { hours: string };
type RawStaff = Omit<Staff, "schedule" | "service_ids"> & { schedule: string | null };

const parseHours = (s: string | null): Hours => (s ? JSON.parse(s) : {});

export function listLocations(opts: { includeInactive?: boolean } = {}): Location[] {
  const rows = all<RawLocation>(
    `SELECT * FROM locations ${opts.includeInactive ? "" : "WHERE active = 1 OR coming_soon = 1"} ORDER BY sort, id`
  );
  return rows.map((r) => ({ ...r, hours: parseHours(r.hours) }));
}
export function getLocation(id: number): Location | undefined {
  const r = get<RawLocation>("SELECT * FROM locations WHERE id = ?", id);
  return r && { ...r, hours: parseHours(r.hours) };
}

export function listCategories(): Category[] {
  return all<Category>("SELECT * FROM categories ORDER BY sort, id");
}

export function listServices(opts: { includeInactive?: boolean } = {}): Service[] {
  return all<Service>(
    `SELECT s.* FROM services s JOIN categories c ON c.id = s.category_id
     ${opts.includeInactive ? "" : "WHERE s.active = 1"} ORDER BY c.sort, s.sort, s.id`
  );
}

export function catalog() {
  const categories = listCategories();
  const services = listServices();
  return categories
    .map((c) => ({ ...c, services: services.filter((s) => s.category_id === c.id) }))
    .filter((c) => c.services.length);
}

export function listStaff(opts: { includeInactive?: boolean } = {}): Staff[] {
  const rows = all<RawStaff>(
    `SELECT * FROM staff ${opts.includeInactive ? "" : "WHERE active = 1"} ORDER BY sort, id`
  );
  const links = all<{ staff_id: number; service_id: number }>("SELECT staff_id, service_id FROM staff_services");
  return rows.map((r) => ({
    ...r,
    schedule: parseHours(r.schedule),
    service_ids: links.filter((l) => l.staff_id === r.id).map((l) => l.service_id),
  }));
}
export function getStaff(id: number) {
  return listStaff({ includeInactive: true }).find((s) => s.id === id);
}

export function staffCanDo(staff: Staff, serviceIds: number[]) {
  return staff.service_ids.length === 0 || serviceIds.every((id) => staff.service_ids.includes(id));
}

const BOOKING_SELECT = `
  SELECT b.*, c.name AS client_name, c.phone AS client_phone, c.email AS client_email,
         s.name AS staff_name, l.name AS location_name, l.address AS location_address
  FROM bookings b
  JOIN clients c ON c.id = b.client_id
  JOIN staff s ON s.id = b.staff_id
  JOIN locations l ON l.id = b.location_id`;

function withServices(rows: Omit<Booking, "services">[]): Booking[] {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const svc = all<{ booking_id: number } & Booking["services"][number]>(
    `SELECT * FROM booking_services WHERE booking_id IN (${ids.map(() => "?").join(",")})`,
    ...ids
  );
  return rows.map((r) => ({ ...r, services: svc.filter((s) => s.booking_id === r.id) }));
}

export function getBookingByCode(code: string): Booking | undefined {
  return withServices(all(`${BOOKING_SELECT} WHERE b.code = ?`, code.toUpperCase()))[0];
}
export function getBooking(id: number): Booking | undefined {
  return withServices(all(`${BOOKING_SELECT} WHERE b.id = ?`, id))[0];
}

export function listBookings(f: {
  from?: string;
  to?: string;
  status?: string;
  staffId?: number;
  locationId?: number;
  clientId?: number;
  q?: string;
  limit?: number;
  order?: "asc" | "desc";
}): Booking[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.from) (where.push("b.date >= ?"), params.push(f.from));
  if (f.to) (where.push("b.date <= ?"), params.push(f.to));
  if (f.status) (where.push("b.status = ?"), params.push(f.status));
  if (f.staffId) (where.push("b.staff_id = ?"), params.push(f.staffId));
  if (f.locationId) (where.push("b.location_id = ?"), params.push(f.locationId));
  if (f.clientId) (where.push("b.client_id = ?"), params.push(f.clientId));
  if (f.q) {
    where.push("(c.name LIKE ? OR c.phone LIKE ? OR b.code LIKE ?)");
    params.push(`%${f.q}%`, `%${f.q}%`, `%${f.q.toUpperCase()}%`);
  }
  const dir = f.order === "desc" ? "DESC" : "ASC";
  const sql = `${BOOKING_SELECT} ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY b.date ${dir}, b.start_min ${dir} LIMIT ${f.limit ?? 500}`;
  return withServices(all(sql, ...params));
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Por confirmar",
  confirmed: "Confirmada",
  completed: "Atendida",
  cancelled: "Cancelada",
  no_show: "No asistió",
};
