import "server-only";
import { NextResponse } from "next/server";
import { availableDays, getSlots } from "./availability";
import { BookingError, bookingInput, createBooking, setBookingStatus } from "./bookings";
import { clock } from "./format";
import { publicCatalog, publicLocations, publicTeam } from "./public-data";
import { getBookingByCode, listLocations, type Booking } from "./repo";

// Handlers compartidos entre el sitio público (/api/*) y la API de integraciones (/api/v1/*).

async function firstLocationId() {
  return (await listLocations()).find((l) => l.active)?.id ?? 0;
}

export async function catalogHandler() {
  const [locations, categories, team] = await Promise.all([publicLocations(), publicCatalog(), publicTeam()]);
  return NextResponse.json({ locations, categories, team });
}

export async function availabilityHandler(req: Request) {
  const u = new URL(req.url);
  const locationId = Number(u.searchParams.get("location")) || (await firstLocationId());
  const serviceIds = (u.searchParams.get("services") ?? "").split(",").map(Number).filter(Boolean);
  const staffId = Number(u.searchParams.get("staff")) || null;
  const date = u.searchParams.get("date");
  if (!serviceIds.length) return NextResponse.json({ error: "Indica al menos un servicio (services=1,2)" }, { status: 400 });

  if (!date) {
    const days = Math.min(Number(u.searchParams.get("days")) || 21, 60);
    return NextResponse.json({ days: await availableDays({ locationId, serviceIds, staffId, days }) });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Fecha inválida (YYYY-MM-DD)" }, { status: 400 });
  const slots = await getSlots({ locationId, date, serviceIds, staffId });
  return NextResponse.json({ date, slots: slots.map((s) => ({ ...s, label: clock(s.start) })) });
}

export async function createBookingHandler(req: Request, source: "web" | "api" | "novacall" = "web") {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = bookingInput.safeParse({
    ...body,
    locationId: body.locationId ?? (await firstLocationId()),
    source: source === "web" ? "web" : ((body.source as string) ?? source),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const b = await createBooking(parsed.data);
    return NextResponse.json({ booking: serializeBooking(b) }, { status: 201 });
  } catch (e) {
    if (e instanceof BookingError) return NextResponse.json({ error: e.message }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: "No pudimos crear la cita" }, { status: 500 });
  }
}

export async function getBookingHandler(code: string) {
  const b = await getBookingByCode(code);
  if (!b) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  return NextResponse.json({ booking: serializeBooking(b) });
}

export async function cancelBookingHandler(code: string) {
  const b = await getBookingByCode(code);
  if (!b) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  if (!["pending", "confirmed"].includes(b.status)) return NextResponse.json({ error: "La cita ya no se puede cancelar" }, { status: 409 });
  const updated = await setBookingStatus(b.id, "cancelled");
  return NextResponse.json({ booking: serializeBooking(updated!) });
}

export function serializeBooking(b: Booking) {
  return {
    code: b.code,
    status: b.status,
    date: b.date,
    start: b.start_min,
    end: b.end_min,
    time: clock(b.start_min),
    location: { id: b.location_id, name: b.location_name, address: b.location_address },
    staff: { id: b.staff_id, name: b.staff_name },
    client: { name: b.client_name },
    services: b.services.map((s) => ({ id: s.service_id, name: s.name, price: s.price, duration: s.duration_min })),
    total: b.total_price,
  };
}
