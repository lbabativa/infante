import "server-only";
import dns from "node:dns";
import { MongoClient, type ClientSession, type Db, type Document } from "mongodb";
import { defaultTemplates, seedCategories, seedLocation, seedTeam } from "./seed-data";
import { slugify } from "./format";

// ── Conexión ──────────────────────────────────────────────────
// Cada documento conserva un `id` numérico (URLs cortas: /admin/citas/12) además del _id de Mongo.

const uri = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "infante";

// Algunas redes locales no resuelven registros SRV desde Node; permite forzar DNS públicos en desarrollo.
if (process.env.MONGODB_DNS_SERVERS) dns.setServers(process.env.MONGODB_DNS_SERVERS.split(","));

const g = globalThis as unknown as { __mongo?: Promise<{ client: MongoClient; db: Db }> };

async function connect() {
  if (!uri) throw new Error("Falta MONGODB_URI");
  const client = new MongoClient(uri, { maxPoolSize: 10 });
  await client.connect();
  const db = client.db(DB_NAME);
  await ensureIndexes(db);
  await seed(db);
  return { client, db };
}

async function conn() {
  if (!g.__mongo) g.__mongo = connect().catch((e) => {
    g.__mongo = undefined;
    throw e;
  });
  return g.__mongo;
}

export async function db() {
  return (await conn()).db;
}

export type CollectionName =
  | "locations"
  | "categories"
  | "services"
  | "staff"
  | "time_off"
  | "clients"
  | "bookings"
  | "messages"
  | "settings"
  | "applications"
  | "media";

export async function col<T extends Document = Document>(name: CollectionName) {
  return (await db()).collection<T>(name);
}

/** Proyección estándar: nunca devolvemos el _id de Mongo a la app. */
export const NO_ID = { projection: { _id: 0 } } as const;

/** Autoincremental por colección (colección `counters`). */
export async function nextId(name: CollectionName, session?: ClientSession) {
  const r = await (await db())
    .collection<{ _id: string; seq: number }>("counters")
    .findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after", session });
  return r!.seq;
}

export const nowIso = () => new Date().toISOString();

/**
 * Ejecuta fn en una transacción que además "toma" un candado (documento en `locks`).
 * Dos reservas simultáneas sobre el mismo candado chocan y Mongo reintenta una de ellas,
 * así la verificación de disponibilidad + inserción es atómica (evita dobles reservas).
 */
export async function withLock<T>(key: string, fn: (session: ClientSession) => Promise<T>): Promise<T> {
  const { client, db: d } = await conn();
  const session = client.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      await d.collection<{ _id: string; v: number }>("locks").updateOne({ _id: key }, { $inc: { v: 1 } }, { upsert: true, session });
      result = await fn(session);
    });
    return result!;
  } finally {
    await session.endSession();
  }
}

async function ensureIndexes(d: Db) {
  await Promise.all([
    ...(["locations", "categories", "services", "staff", "time_off", "clients", "bookings", "messages", "applications"] as const).map((c) =>
      d.collection(c).createIndex({ id: 1 }, { unique: true })
    ),
    d.collection("bookings").createIndex({ code: 1 }, { unique: true }),
    d.collection("bookings").createIndex({ date: 1, staff_id: 1 }),
    d.collection("bookings").createIndex({ client_id: 1 }),
    d.collection("clients").createIndex({ phone: 1 }, { unique: true }),
    d.collection("time_off").createIndex({ date: 1 }),
    d.collection("messages").createIndex({ status: 1 }),
  ]);
}

// ── Ajustes ───────────────────────────────────────────────────

export const DEFAULT_SETTINGS: Record<string, string> = {
  auto_confirm: "1",
  slot_step: "30",
  lead_minutes: "60",
  max_days_ahead: "60",
  reminder_24h: "1",
  reminder_3h: "1",
  followup: "1",
  salon_whatsapp: seedLocation.whatsapp,
  review_url: "https://www.google.com/maps/search/?api=1&query=Infante+Hair+Stylist+Bogot%C3%A1",
  instagram_url: "https://www.instagram.com/infantehairstylist",
  ...Object.fromEntries(Object.entries(defaultTemplates).map(([k, v]) => [k, v.body])),
};

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await (await col<{ key: string; value: string }>("settings")).find({}, NO_ID).toArray();
  return { ...DEFAULT_SETTINGS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
}
export async function getSetting(key: string): Promise<string> {
  const row = await (await col<{ key: string; value: string }>("settings")).findOne({ key });
  return row?.value ?? DEFAULT_SETTINGS[key] ?? "";
}
export async function setSetting(key: string, value: string) {
  await (await col("settings")).updateOne({ key }, { $set: { key, value } }, { upsert: true });
}

// ── Datos semilla (solo la primera vez) ───────────────────────

async function seed(d: Db) {
  // Marca atómica: si otra instancia ya sembró (o está sembrando), no repetimos.
  const meta = d.collection<{ _id: string; at: string }>("meta");
  try {
    await meta.insertOne({ _id: "seed", at: nowIso() });
  } catch {
    return;
  }
  const counters = d.collection<{ _id: string; seq: number }>("counters");
  const setCounter = (name: string, seq: number) => counters.updateOne({ _id: name }, { $set: { seq } }, { upsert: true });

  await d.collection("locations").insertMany([
    { id: 1, ...pick(seedLocation), hours: seedLocation.hours, active: 1, coming_soon: 0, sort: 0 },
    {
      id: 2,
      slug: "nueva-sede",
      name: "Nueva sede",
      address: "Muy pronto",
      city: "Bogotá D.C.",
      phone: null,
      whatsapp: null,
      maps_url: null,
      hours: seedLocation.hours,
      active: 0,
      coming_soon: 1,
      sort: 1,
    },
  ]);
  await setCounter("locations", 2);

  let catId = 0;
  let svcId = 0;
  const cats: Document[] = [];
  const svcs: Document[] = [];
  seedCategories.forEach((c, ci) => {
    catId++;
    cats.push({ id: catId, slug: c.slug, name: c.name, tagline: c.tagline, sort: ci });
    c.services.forEach((s, si) =>
      svcs.push({
        id: ++svcId,
        category_id: catId,
        name: s.name,
        description: s.description ?? null,
        duration_min: s.duration,
        price: s.price,
        price_from: s.from ? 1 : 0,
        featured: s.featured ? 1 : 0,
        active: 1,
        sort: si,
      })
    );
  });
  await d.collection("categories").insertMany(cats);
  await d.collection("services").insertMany(svcs);
  await setCounter("categories", catId);
  await setCounter("services", svcId);

  await d.collection("staff").insertMany(
    seedTeam.map((t, i) => ({
      id: i + 1,
      slug: slugify(t.name),
      name: t.name,
      role: t.role,
      bio: t.bio,
      photo_url: null,
      instagram: null,
      phone: null,
      location_id: 1,
      schedule: seedLocation.hours,
      active: 1,
      bookable: 1,
      sort: i,
      service_ids: [],
    }))
  );
  await setCounter("staff", seedTeam.length);
}

function pick(l: typeof seedLocation) {
  const { slug, name, address, city, phone, whatsapp, maps_url } = l;
  return { slug, name, address, city, phone, whatsapp, maps_url };
}
