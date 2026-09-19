export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const cop_ = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export function cop(n: number) {
  return cop_.format(n).replace(/\s/g, " ");
}

export function money(n: number | null | undefined) {
  if (n == null) return "Según valoración";
  if (n === 0) return "Sin costo";
  return cop(n);
}

export function priceLabel(price: number | null, from: boolean | number) {
  if (price == null || price === 0) return money(price);
  return (from ? "Desde " : "") + money(price);
}

export function duration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function hhmm(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 14:30 → "2:30 p. m." */
export function clock(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const suffix = h >= 12 ? "p. m." : "a. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function parseHHMM(s: string) {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + (m || 0);
}

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const WEEKDAY_NAMES = WEEKDAYS;

export function weekday(date: string) {
  return new Date(date + "T12:00:00Z").getUTCDay();
}

/** "2026-09-19" → "sábado 19 de septiembre" */
export function longDate(date: string) {
  const d = new Date(date + "T12:00:00Z");
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]}`;
}
export function shortDate(date: string) {
  const d = new Date(date + "T12:00:00Z");
  return `${WEEKDAY_SHORT[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`;
}

export function addDays(date: string, n: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Colombia no tiene horario de verano: UTC-5 fijo. */
export function bogotaNow() {
  const d = new Date(Date.now() - 5 * 3600_000);
  return { date: d.toISOString().slice(0, 10), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

/** Normaliza celulares colombianos a formato internacional sin "+" (573001234567). */
export function normalizePhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.length === 10 && d.startsWith("3")) d = "57" + d;
  return d;
}
export function prettyPhone(p: string) {
  const m = p.match(/^57(\d{3})(\d{3})(\d{4})$/);
  return m ? `+57 ${m[1]} ${m[2]} ${m[3]}` : "+" + p;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
