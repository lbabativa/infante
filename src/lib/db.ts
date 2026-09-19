import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { defaultTemplates, seedCategories, seedLocation, seedTeam } from "./seed-data";
import { slugify } from "./format";

// En Vercel solo /tmp es escribible (efímero: se reinicia con cada despliegue o instancia nueva).
const DB_PATH =
  process.env.DATABASE_PATH || (process.env.VERCEL ? "/tmp/infante.db" : path.join(process.cwd(), "data", "infante.db"));

const SCHEMA = `
CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Bogotá D.C.',
  phone TEXT,
  whatsapp TEXT,
  maps_url TEXT,
  hours TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  coming_soon INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT,
  duration_min INTEGER NOT NULL,
  price INTEGER,
  price_from INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  bio TEXT,
  photo_url TEXT,
  instagram TEXT,
  phone TEXT,
  location_id INTEGER REFERENCES locations(id),
  schedule TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  bookable INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS staff_services (
  staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);
CREATE TABLE IF NOT EXISTS time_off (
  id INTEGER PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
  location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  start_min INTEGER NOT NULL,
  end_min INTEGER NOT NULL,
  reason TEXT
);
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  location_id INTEGER NOT NULL REFERENCES locations(id),
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  date TEXT NOT NULL,
  start_min INTEGER NOT NULL,
  end_min INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  total_price INTEGER,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'web',
  reminder_24_at TEXT,
  reminder_3_at TEXT,
  followup_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date, staff_id);
CREATE TABLE IF NOT EXISTS booking_services (
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_id INTEGER,
  name TEXT NOT NULL,
  price INTEGER,
  duration_min INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  to_addr TEXT NOT NULL,
  template TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  provider TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  role TEXT,
  experience TEXT,
  instagram TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'nueva',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

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

function seed(db: DatabaseSync) {
  const hasData = db.prepare("SELECT COUNT(*) AS n FROM locations").get() as { n: number };
  if (hasData.n > 0) return;

  db.exec("BEGIN");
  try {
    const loc = db
      .prepare(
        "INSERT INTO locations (slug,name,address,city,phone,whatsapp,maps_url,hours,sort) VALUES (?,?,?,?,?,?,?,?,0)"
      )
      .run(
        seedLocation.slug,
        seedLocation.name,
        seedLocation.address,
        seedLocation.city,
        seedLocation.phone,
        seedLocation.whatsapp,
        seedLocation.maps_url,
        JSON.stringify(seedLocation.hours)
      );
    const locationId = Number(loc.lastInsertRowid);

    db.prepare(
      "INSERT INTO locations (slug,name,address,city,hours,active,coming_soon,sort) VALUES (?,?,?,?,?,0,1,1)"
    ).run("nueva-sede", "Nueva sede", "Muy pronto", "Bogotá D.C.", JSON.stringify(seedLocation.hours));

    const insCat = db.prepare("INSERT INTO categories (slug,name,tagline,sort) VALUES (?,?,?,?)");
    const insSvc = db.prepare(
      "INSERT INTO services (category_id,name,description,duration_min,price,price_from,featured,sort) VALUES (?,?,?,?,?,?,?,?)"
    );
    seedCategories.forEach((c, ci) => {
      const catId = Number(insCat.run(c.slug, c.name, c.tagline, ci).lastInsertRowid);
      c.services.forEach((s, si) =>
        insSvc.run(catId, s.name, s.description ?? null, s.duration, s.price, s.from ? 1 : 0, s.featured ? 1 : 0, si)
      );
    });

    const insStaff = db.prepare(
      "INSERT INTO staff (slug,name,role,bio,location_id,schedule,sort) VALUES (?,?,?,?,?,?,?)"
    );
    seedTeam.forEach((t, i) =>
      insStaff.run(slugify(t.name), t.name, t.role, t.bio, locationId, JSON.stringify(seedLocation.hours), i)
    );

    const insSetting = db.prepare("INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)");
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) insSetting.run(k, v);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

function open(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA);
  seed(db);
  return db;
}

const g = globalThis as unknown as { __infanteDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (!g.__infanteDb) g.__infanteDb = open();
  return g.__infanteDb;
}

/** Ejecuta fn dentro de una transacción (SQLite es síncrono: sin carreras entre verificar y reservar). */
export function tx<T>(fn: () => T): T {
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const r = fn();
    d.exec("COMMIT");
    return r;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}

export function all<T>(sql: string, ...params: unknown[]): T[] {
  return db().prepare(sql).all(...(params as never[])) as T[];
}
export function get<T>(sql: string, ...params: unknown[]): T | undefined {
  return db().prepare(sql).get(...(params as never[])) as T | undefined;
}
export function run(sql: string, ...params: unknown[]) {
  return db().prepare(sql).run(...(params as never[]));
}

export function getSetting(key: string): string {
  const row = get<{ value: string }>("SELECT value FROM settings WHERE key = ?", key);
  return row?.value ?? DEFAULT_SETTINGS[key] ?? "";
}
export function setSetting(key: string, value: string) {
  run("INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", key, value);
}
