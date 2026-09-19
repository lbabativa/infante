"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, endSession, requireAdmin, startSession } from "@/lib/auth";
import { BookingError, bookingInput, createBooking, rescheduleBooking, setBookingStatus, upsertClient } from "@/lib/bookings";
import { run, setSetting, tx, DEFAULT_SETTINGS } from "@/lib/db";
import { normalizePhone, parseHHMM, slugify } from "@/lib/format";
import { runAutomations } from "@/lib/notify";
import type { BookingStatus } from "@/lib/repo";
import { saveUpload } from "@/lib/uploads";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => Number(fd.get(k) ?? 0);
const bool = (fd: FormData, k: string) => (fd.get(k) ? 1 : 0);

/** Lee un horario semanal del formulario: d{0..6}_on, d{n}_start, d{n}_end */
function readHours(fd: FormData) {
  const hours: Record<number, [number, number] | null> = {};
  for (let d = 0; d <= 6; d++) {
    hours[d] = fd.get(`d${d}_on`) ? [parseHHMM(str(fd, `d${d}_start`) || "08:00"), parseHHMM(str(fd, `d${d}_end`) || "19:00")] : null;
  }
  return JSON.stringify(hours);
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
    if (e instanceof BookingError)
      return { error: e.message + " Marca “Forzar” para agendar de todos modos (requiere elegir especialista)." };
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
  run("UPDATE bookings SET notes = ?, updated_at = datetime('now') WHERE id = ?", str(fd, "notes") || null, num(fd, "id"));
  revalidatePath(`/admin/citas/${num(fd, "id")}`);
}

// ── Clientes ──────────────────────────────────────────────────
export async function saveClient(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  if (id) {
    run(
      "UPDATE clients SET name = ?, phone = ?, email = ?, notes = ? WHERE id = ?",
      str(fd, "name"),
      normalizePhone(str(fd, "phone")),
      str(fd, "email") || null,
      str(fd, "notes") || null,
      id
    );
  } else upsertClient(str(fd, "name"), str(fd, "phone"), str(fd, "email"));
  revalidatePath("/admin/clientes", "layout");
}

// ── Servicios ─────────────────────────────────────────────────
export async function saveService(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const price = str(fd, "price") === "" ? null : Number(str(fd, "price").replace(/\D/g, ""));
  const values = [
    num(fd, "category_id"),
    str(fd, "name"),
    str(fd, "description") || null,
    num(fd, "duration_min") || 60,
    price,
    bool(fd, "price_from"),
    bool(fd, "featured"),
    bool(fd, "active"),
    num(fd, "sort"),
  ];
  if (id)
    run(
      "UPDATE services SET category_id=?, name=?, description=?, duration_min=?, price=?, price_from=?, featured=?, active=?, sort=? WHERE id=?",
      ...values,
      id
    );
  else run("INSERT INTO services (category_id,name,description,duration_min,price,price_from,featured,active,sort) VALUES (?,?,?,?,?,?,?,?,?)", ...values);
  revalidatePath("/", "layout");
}

export async function saveCategory(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  if (id) run("UPDATE categories SET name=?, tagline=?, sort=? WHERE id=?", str(fd, "name"), str(fd, "tagline"), num(fd, "sort"), id);
  else run("INSERT INTO categories (slug,name,tagline,sort) VALUES (?,?,?,?)", slugify(str(fd, "name")), str(fd, "name"), str(fd, "tagline"), num(fd, "sort") || 99);
  revalidatePath("/", "layout");
}

// ── Equipo ────────────────────────────────────────────────────
export async function saveStaff(fd: FormData) {
  await requireAdmin();
  let id = num(fd, "id");
  const uploaded = await saveUpload(fd.get("photo") as File | null);
  const photo = uploaded ?? (str(fd, "photo_url") || null);
  const values = [
    str(fd, "name"),
    str(fd, "role") || null,
    str(fd, "bio") || null,
    photo,
    str(fd, "instagram") || null,
    str(fd, "phone") ? normalizePhone(str(fd, "phone")) : null,
    num(fd, "location_id") || null,
    readHours(fd),
    bool(fd, "active"),
    bool(fd, "bookable"),
    num(fd, "sort"),
  ];
  const serviceIds = fd.getAll("service_ids").map(Number);
  tx(() => {
    if (id) run("UPDATE staff SET name=?, role=?, bio=?, photo_url=?, instagram=?, phone=?, location_id=?, schedule=?, active=?, bookable=?, sort=? WHERE id=?", ...values, id);
    else
      id = Number(
        run(
          "INSERT INTO staff (slug,name,role,bio,photo_url,instagram,phone,location_id,schedule,active,bookable,sort) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
          `${slugify(str(fd, "name"))}-${Date.now().toString(36)}`,
          ...values
        ).lastInsertRowid
      );
    run("DELETE FROM staff_services WHERE staff_id = ?", id);
    // Si están marcados todos, se guarda vacío = "todos" (incluye servicios futuros).
    if (!fd.get("all_services")) for (const s of serviceIds) run("INSERT INTO staff_services (staff_id, service_id) VALUES (?,?)", id, s);
  });
  revalidatePath("/", "layout");
  redirect(`/admin/equipo/${id}?ok=1`);
}

export async function addTimeOff(fd: FormData) {
  await requireAdmin();
  const allDay = !!fd.get("all_day");
  run(
    "INSERT INTO time_off (staff_id, location_id, date, start_min, end_min, reason) VALUES (?,?,?,?,?,?)",
    num(fd, "staff_id") || null,
    num(fd, "location_id") || null,
    str(fd, "date"),
    allDay ? 0 : parseHHMM(str(fd, "start")),
    allDay ? 1440 : parseHHMM(str(fd, "end")),
    str(fd, "reason") || null
  );
  revalidatePath("/admin", "layout");
}

export async function deleteTimeOff(fd: FormData) {
  await requireAdmin();
  run("DELETE FROM time_off WHERE id = ?", num(fd, "id"));
  revalidatePath("/admin", "layout");
}

// ── Sedes ─────────────────────────────────────────────────────
export async function saveLocation(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const values = [
    str(fd, "name"),
    str(fd, "address"),
    str(fd, "city") || "Bogotá D.C.",
    str(fd, "phone") || null,
    str(fd, "whatsapp") ? normalizePhone(str(fd, "whatsapp")) : null,
    str(fd, "maps_url") || null,
    readHours(fd),
    bool(fd, "active"),
    bool(fd, "coming_soon"),
    num(fd, "sort"),
  ];
  if (id) run("UPDATE locations SET name=?, address=?, city=?, phone=?, whatsapp=?, maps_url=?, hours=?, active=?, coming_soon=?, sort=? WHERE id=?", ...values, id);
  else
    run(
      "INSERT INTO locations (slug,name,address,city,phone,whatsapp,maps_url,hours,active,coming_soon,sort) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      `${slugify(str(fd, "name"))}-${Date.now().toString(36)}`,
      ...values
    );
  revalidatePath("/", "layout");
}

// ── Mensajes y ajustes ────────────────────────────────────────
export async function saveSettings(fd: FormData) {
  await requireAdmin();
  const checkboxes = ["auto_confirm", "reminder_24h", "reminder_3h", "followup"];
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (checkboxes.includes(key)) {
      if (fd.has("_checkboxes")) setSetting(key, fd.get(key) ? "1" : "0");
    } else if (fd.has(key)) setSetting(key, key === "salon_whatsapp" ? normalizePhone(str(fd, key)) : str(fd, key));
  }
  revalidatePath("/", "layout");
}

export async function markMessageSent(fd: FormData) {
  await requireAdmin();
  run("UPDATE messages SET status = 'sent', sent_at = datetime('now'), provider = COALESCE(provider,'') || ' (manual)' WHERE id = ?", num(fd, "id"));
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
  run("UPDATE applications SET status = ? WHERE id = ?", str(fd, "status"), num(fd, "id"));
  revalidatePath("/admin/postulaciones");
}
