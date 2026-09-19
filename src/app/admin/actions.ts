"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, endSession, requireAdmin, startSession } from "@/lib/auth";
import { BookingError, bookingInput, createBooking, rescheduleBooking, setBookingStatus, upsertClient } from "@/lib/bookings";
import { col, DEFAULT_SETTINGS, nextId, nowIso, setSetting } from "@/lib/db";
import { normalizePhone, parseHHMM, slugify } from "@/lib/format";
import { runAutomations, type Message } from "@/lib/notify";
import type { BookingDoc, BookingStatus, Hours } from "@/lib/repo";
import { saveUpload } from "@/lib/uploads";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => Number(fd.get(k) ?? 0);
const bool = (fd: FormData, k: string) => (fd.get(k) ? 1 : 0);

/** Lee un horario semanal del formulario: d{0..6}_on, d{n}_start, d{n}_end */
function readHours(fd: FormData): Hours {
  const hours: Hours = {};
  for (let d = 0; d <= 6; d++) {
    hours[d] = fd.get(`d${d}_on`) ? [parseHHMM(str(fd, `d${d}_start`) || "08:00"), parseHHMM(str(fd, `d${d}_end`) || "19:00")] : null;
  }
  return hours;
}

// ── Sesión ────────────────────────────────────────────────────
export async function login(_prev: { error?: string }, fd: FormData): Promise<{ error?: string }> {
  if (!checkPassword(str(fd, "password"))) return { error: "Contraseña incorrecta" };
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

// ── Citas ─────────────────────────────────────────────────────
export async function changeStatus(fd: FormData) {
  await requireAdmin();
  await setBookingStatus(num(fd, "id"), str(fd, "status") as BookingStatus, { notify: fd.get("notify") !== "0" });
  revalidatePath("/admin", "layout");
}

export async function createAdminBooking(_prev: { error?: string }, fd: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = bookingInput.safeParse({
    locationId: num(fd, "locationId"),
    serviceIds: fd.getAll("serviceIds").map(Number),
    staffId: num(fd, "staffId") || null,
    date: str(fd, "date"),
    start: parseHHMM(str(fd, "time") || "00:00"),
    name: str(fd, "name"),
    phone: str(fd, "phone"),
    email: str(fd, "email"),
    notes: str(fd, "notes"),
    source: "admin",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  let id: number;
  try {
    id = (await createBooking(parsed.data, { force: !!fd.get("force") })).id;
  } catch (e) {
    if (e instanceof BookingError) return { error: e.message + " Marca “Forzar” para agendar de todos modos (requiere elegir especialista)." };
    throw e;
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/citas/${id}`);
}

export async function reschedule(fd: FormData) {
  await requireAdmin();
  await rescheduleBooking(num(fd, "id"), str(fd, "date"), parseHHMM(str(fd, "time")), num(fd, "staffId"));
  revalidatePath("/admin", "layout");
}

export async function saveBookingNotes(fd: FormData) {
  await requireAdmin();
  await (await col<BookingDoc>("bookings")).updateOne({ id: num(fd, "id") }, { $set: { notes: str(fd, "notes") || null, updated_at: nowIso() } });
  revalidatePath(`/admin/citas/${num(fd, "id")}`);
}

// ── Clientes ──────────────────────────────────────────────────
export async function saveClient(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  if (id) {
    await (await col("clients")).updateOne(
      { id },
      { $set: { name: str(fd, "name"), phone: normalizePhone(str(fd, "phone")), email: str(fd, "email") || null, notes: str(fd, "notes") || null } }
    );
  } else await upsertClient(str(fd, "name"), str(fd, "phone"), str(fd, "email"));
  revalidatePath("/admin/clientes", "layout");
}

// ── Servicios ─────────────────────────────────────────────────
export async function saveService(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const doc = {
    category_id: num(fd, "category_id"),
    name: str(fd, "name"),
    description: str(fd, "description") || null,
    duration_min: num(fd, "duration_min") || 60,
    price: str(fd, "price") === "" ? null : Number(str(fd, "price").replace(/\D/g, "")),
    price_from: bool(fd, "price_from"),
    featured: bool(fd, "featured"),
    active: bool(fd, "active"),
    sort: num(fd, "sort"),
  };
  const services = await col("services");
  if (id) await services.updateOne({ id }, { $set: doc });
  else await services.insertOne({ id: await nextId("services"), ...doc });
  revalidatePath("/", "layout");
}

export async function saveCategory(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const categories = await col("categories");
  if (id) await categories.updateOne({ id }, { $set: { name: str(fd, "name"), tagline: str(fd, "tagline"), sort: num(fd, "sort") } });
  else
    await categories.insertOne({
      id: await nextId("categories"),
      slug: slugify(str(fd, "name")),
      name: str(fd, "name"),
      tagline: str(fd, "tagline"),
      sort: num(fd, "sort") || 99,
    });
  revalidatePath("/", "layout");
}

// ── Equipo ────────────────────────────────────────────────────
export async function saveStaff(fd: FormData) {
  await requireAdmin();
  let id = num(fd, "id");
  const uploaded = await saveUpload(fd.get("photo") as File | null);
  const doc = {
    name: str(fd, "name"),
    role: str(fd, "role") || null,
    bio: str(fd, "bio") || null,
    photo_url: uploaded ?? (str(fd, "photo_url") || null),
    instagram: str(fd, "instagram") || null,
    phone: str(fd, "phone") ? normalizePhone(str(fd, "phone")) : null,
    location_id: num(fd, "location_id") || null,
    schedule: readHours(fd),
    active: bool(fd, "active"),
    bookable: bool(fd, "bookable"),
    sort: num(fd, "sort"),
    // Vacío = "todos los servicios" (incluye los que se agreguen en el futuro).
    service_ids: fd.get("all_services") ? [] : fd.getAll("service_ids").map(Number),
  };
  const staff = await col("staff");
  if (id) await staff.updateOne({ id }, { $set: doc });
  else {
    id = await nextId("staff");
    await staff.insertOne({ id, slug: `${slugify(doc.name)}-${id}`, ...doc });
  }
  revalidatePath("/", "layout");
  redirect(`/admin/equipo/${id}?ok=1`);
}

export async function addTimeOff(fd: FormData) {
  await requireAdmin();
  const allDay = !!fd.get("all_day");
  await (await col("time_off")).insertOne({
    id: await nextId("time_off"),
    staff_id: num(fd, "staff_id") || null,
    location_id: num(fd, "location_id") || null,
    date: str(fd, "date"),
    start_min: allDay ? 0 : parseHHMM(str(fd, "start")),
    end_min: allDay ? 1440 : parseHHMM(str(fd, "end")),
    reason: str(fd, "reason") || null,
  });
  revalidatePath("/admin", "layout");
}

export async function deleteTimeOff(fd: FormData) {
  await requireAdmin();
  await (await col("time_off")).deleteOne({ id: num(fd, "id") });
  revalidatePath("/admin", "layout");
}

// ── Sedes ─────────────────────────────────────────────────────
export async function saveLocation(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const doc = {
    name: str(fd, "name"),
    address: str(fd, "address"),
    city: str(fd, "city") || "Bogotá D.C.",
    phone: str(fd, "phone") || null,
    whatsapp: str(fd, "whatsapp") ? normalizePhone(str(fd, "whatsapp")) : null,
    maps_url: str(fd, "maps_url") || null,
    hours: readHours(fd),
    active: bool(fd, "active"),
    coming_soon: bool(fd, "coming_soon"),
    sort: num(fd, "sort"),
  };
  const locations = await col("locations");
  if (id) await locations.updateOne({ id }, { $set: doc });
  else {
    const newId = await nextId("locations");
    await locations.insertOne({ id: newId, slug: `${slugify(doc.name)}-${newId}`, ...doc });
  }
  revalidatePath("/", "layout");
}

// ── Mensajes y ajustes ────────────────────────────────────────
export async function saveSettings(fd: FormData) {
  await requireAdmin();
  const checkboxes = ["auto_confirm", "reminder_24h", "reminder_3h", "followup"];
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (checkboxes.includes(key)) {
      if (fd.has("_checkboxes")) await setSetting(key, fd.get(key) ? "1" : "0");
    } else if (fd.has(key)) await setSetting(key, key === "salon_whatsapp" ? normalizePhone(str(fd, key)) : str(fd, key));
  }
  revalidatePath("/", "layout");
}

export async function markMessageSent(fd: FormData) {
  await requireAdmin();
  const messages = await col<Message>("messages");
  const m = await messages.findOne({ id: num(fd, "id") });
  if (m) await messages.updateOne({ id: m.id }, { $set: { status: "sent", sent_at: nowIso(), provider: `${m.provider ?? ""} (manual)` } });
  revalidatePath("/admin/mensajes");
}

export async function runAutomationsNow() {
  await requireAdmin();
  await runAutomations();
  revalidatePath("/admin", "layout");
}

// ── Postulaciones ─────────────────────────────────────────────
export async function setApplicationStatus(fd: FormData) {
  await requireAdmin();
  await (await col("applications")).updateOne({ id: num(fd, "id") }, { $set: { status: str(fd, "status") } });
  revalidatePath("/admin/postulaciones");
}
