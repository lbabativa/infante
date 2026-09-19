"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { clock, duration, longDate, money, priceLabel, WEEKDAY_SHORT } from "@/lib/format";
import type { PublicCategory, PublicLocation, PublicStaff } from "@/lib/public-types";
import { Portrait } from "./Portrait";

type Slot = { start: number; staffIds: number[]; label: string };
type Created = { code: string; date: string; time: string; staff: { name: string }; status: string; start: number; end: number };

const STEPS = ["Servicios", "Especialista", "Fecha y hora", "Tus datos"];
const EASE = [0.22, 1, 0.36, 1] as const;

export function BookingWizard({
  categories,
  team,
  locations,
  initial,
}: {
  categories: PublicCategory[];
  team: PublicStaff[];
  locations: PublicLocation[];
  initial: { serviceId?: number; staffId?: number; locationId?: number };
}) {
  const open = locations.filter((l) => l.active);
  const allServices = useMemo(() => categories.flatMap((c) => c.services), [categories]);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [locationId, setLocationId] = useState(initial.locationId ?? open[0]?.id);
  const [serviceIds, setServiceIds] = useState<number[]>(initial.serviceId ? [initial.serviceId] : []);
  const [staffId, setStaffId] = useState<number | null>(initial.staffId ?? null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [consent, setConsent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);

  const chosen = allServices.filter((s) => serviceIds.includes(s.id));
  const totalMin = chosen.reduce((a, s) => a + s.duration_min, 0);
  const priced = chosen.every((s) => s.price != null);
  const total = chosen.reduce((a, s) => a + (s.price ?? 0), 0);
  const fromPrice = chosen.some((s) => s.price_from);
  const staff = team.find((t) => t.id === staffId) ?? null;
  const location = locations.find((l) => l.id === locationId);

  const eligible = team.filter(
    (t) =>
      t.bookable &&
      (t.location_id == null || t.location_id === locationId) &&
      (t.service_ids.length === 0 || serviceIds.every((id) => t.service_ids.includes(id)))
  );

  // Si el especialista preseleccionado no hace el servicio elegido, se libera la elección.
  useEffect(() => {
    if (staffId && !eligible.some((e) => e.id === staffId)) setStaffId(null);
  }, [eligible, staffId]);

  useEffect(() => {
    setSlot(null);
  }, [serviceIds, staffId, date, locationId]);

  function go(n: number) {
    setDir(n > step ? 1 : -1);
    setStep(n);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    if (!slot || !date) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, serviceIds, staffId, date, start: slot.start, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No pudimos agendar tu cita");
        if (res.status === 409) {
          setSlot(null);
          go(2);
        }
        return;
      }
      setCreated(data.booking);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Revisa tu conexión e inténtalo de nuevo");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) return <Success created={created} services={chosen.map((s) => s.name)} location={location} />;

  const canNext = [serviceIds.length > 0, true, !!slot, form.name.trim().length > 1 && form.phone.replace(/\D/g, "").length >= 10 && consent][step];

  return (
    <div className="mx-auto grid max-w-[1400px] gap-10 px-5 pb-32 md:px-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="min-w-0">
        {/* Progreso */}
        <ol className="mb-10 grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                disabled={i > step}
                onClick={() => i < step && go(i)}
                className="group w-full text-left disabled:cursor-default"
              >
                <div className="h-px w-full overflow-hidden bg-white/10">
                  <motion.div className="h-px bg-champagne" animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.6, ease: EASE }} />
                </div>
                <p className={`eyebrow mt-3 hidden sm:block ${i === step ? "text-ivory" : i < step ? "text-champagne group-hover:text-gold" : "text-ivory/30"}`}>
                  0{i + 1} · {s}
                </p>
              </button>
            </li>
          ))}
        </ol>
        <p className="eyebrow mb-4 text-champagne sm:hidden">
          Paso {step + 1} de 4 · {STEPS[step]}
        </p>

        {open.length > 1 && step === 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {open.map((l) => (
              <button
                key={l.id}
                onClick={() => setLocationId(l.id)}
                className={`rounded-full border px-4 py-2 text-sm ${l.id === locationId ? "border-champagne bg-champagne text-ink" : "border-white/15 text-ivory/70"}`}
              >
                {l.name}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -50 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            {step === 0 && <StepServices categories={categories} selected={serviceIds} onToggle={(id) => setServiceIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))} />}
            {step === 1 && (
              <StepStaff
                team={eligible}
                selected={staffId}
                onSelect={(id) => {
                  setStaffId(id);
                  go(2);
                }}
              />
            )}
            {step === 2 && locationId && (
              <StepDateTime
                locationId={locationId}
                serviceIds={serviceIds}
                staffId={staffId}
                date={date}
                setDate={setDate}
                slot={slot}
                setSlot={setSlot}
                team={team}
              />
            )}
            {step === 3 && <StepDetails form={form} setForm={setForm} consent={consent} setConsent={setConsent} />}
          </motion.div>
        </AnimatePresence>

        {error && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-xl border border-blush/40 bg-blush/10 px-4 py-3 text-sm text-blush">
            {error}
          </motion.p>
        )}
      </div>

      {/* Resumen */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-coal/95 p-4 backdrop-blur-xl lg:static lg:rounded-[1.75rem] lg:border lg:p-7">
          <div className="hidden lg:block">
            <p className="eyebrow text-champagne">Tu cita</p>
            <p className="mt-2 font-display text-3xl">{location?.name ?? "Infante"}</p>
            <div className="hairline my-6" />
            {chosen.length === 0 ? (
              <p className="text-sm text-ivory/50">Elige uno o varios servicios para empezar.</p>
            ) : (
              <ul className="space-y-3">
                {chosen.map((s) => (
                  <li key={s.id} className="flex items-start justify-between gap-4 text-sm">
                    <span>
                      {s.name}
                      <span className="block text-xs text-ivory/40">{duration(s.duration_min)}</span>
                    </span>
                    <span className="shrink-0 text-ivory/70">{priceLabel(s.price, s.price_from)}</span>
                  </li>
                ))}
              </ul>
            )}
            <dl className="mt-6 space-y-2 text-sm">
              <Row k="Especialista" v={staff?.name ?? (step > 1 ? "Sin preferencia" : "—")} />
              <Row k="Fecha" v={date ? longDate(date) : "—"} />
              <Row k="Hora" v={slot ? clock(slot.start) : "—"} />
              <Row k="Duración" v={totalMin ? duration(totalMin) : "—"} />
            </dl>
            <div className="hairline my-6" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-ivory/50">Total estimado</p>
              <p className="font-display text-2xl text-gold">
                {chosen.length ? (priced ? (fromPrice ? "Desde " : "") + money(total) : "Por valorar") : "—"}
              </p>
            </div>
            <div className="flex gap-2">
              {step > 0 && (
                <button onClick={() => go(step - 1)} className="rounded-full border border-white/15 px-4 py-3 text-sm text-ivory/70 hover:border-ivory/40">
                  ←
                </button>
              )}
              {step < 3 ? (
                <button
                  disabled={!canNext}
                  onClick={() => go(step + 1)}
                  className="rounded-full bg-ivory px-6 py-3 text-sm font-semibold text-ink transition hover:bg-champagne disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Continuar →
                </button>
              ) : (
                <button
                  disabled={!canNext || submitting}
                  onClick={submit}
                  className="rounded-full bg-champagne px-6 py-3 text-sm font-semibold text-ink transition hover:bg-gold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? "Agendando…" : "Confirmar cita"}
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ivory/40">{k}</dt>
      <dd className="text-right first-letter:uppercase">{v}</dd>
    </div>
  );
}

function StepServices({ categories, selected, onToggle }: { categories: PublicCategory[]; selected: number[]; onToggle: (id: number) => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<number | "all">("all");
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const list = categories
    .filter((c) => cat === "all" || c.id === cat)
    .map((c) => ({ ...c, services: c.services.filter((s) => norm(s.name).includes(norm(q))) }))
    .filter((c) => c.services.length);

  return (
    <div>
      <h1 className="font-display text-5xl leading-none md:text-6xl">
        ¿Qué te <em className="text-gold">hacemos</em> hoy?
      </h1>
      <p className="mt-3 text-ivory/60">Puedes combinar varios servicios en una misma cita.</p>
      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar: balayage, keratina, uñas…"
          className="w-full rounded-full border border-white/15 bg-transparent px-5 py-3 text-sm outline-none placeholder:text-ivory/30 focus:border-champagne md:max-w-xs"
        />
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
          {[{ id: "all" as const, name: "Todo" }, ...categories].map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs transition ${cat === c.id ? "bg-ivory text-ink" : "border border-white/10 text-ivory/60 hover:text-ivory"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 space-y-12">
        {list.map((c) => (
          <section key={c.id}>
            <h2 className="eyebrow mb-4 text-champagne">{c.name}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {c.services.map((s) => {
                const on = selected.includes(s.id);
                return (
                  <motion.button
                    key={s.id}
                    layout
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onToggle(s.id)}
                    className={`relative flex items-start gap-4 rounded-2xl border p-5 text-left transition-colors ${
                      on ? "border-champagne bg-champagne/10" : "border-white/10 bg-coal/50 hover:border-white/25"
                    }`}
                  >
                    <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${on ? "border-champagne bg-champagne text-ink" : "border-white/30"}`}>
                      <AnimatePresence>
                        {on && (
                          <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} viewBox="0 0 12 12" className="h-3 w-3">
                            <path d="M2 6.5 5 9l5-6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{s.name}</span>
                      {s.description && <span className="mt-1 line-clamp-2 block text-xs text-ivory/45">{s.description}</span>}
                      <span className="mt-3 flex gap-4 text-xs">
                        <span className="text-gold">{priceLabel(s.price, s.price_from)}</span>
                        <span className="text-ivory/40">{duration(s.duration_min)}</span>
                      </span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </section>
        ))}
        {!list.length && <p className="text-ivory/50">No encontramos servicios con “{q}”.</p>}
      </div>
    </div>
  );
}

function StepStaff({ team, selected, onSelect }: { team: PublicStaff[]; selected: number | null; onSelect: (id: number | null) => void }) {
  return (
    <div>
      <h1 className="font-display text-5xl leading-none md:text-6xl">
        ¿Con <em className="text-gold">quién</em>?
      </h1>
      <p className="mt-3 text-ivory/60">Elige a tu especialista o deja que te asignemos al primero disponible.</p>
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <button
          onClick={() => onSelect(null)}
          className={`group flex aspect-[3/4] flex-col justify-end rounded-2xl border p-5 text-left transition ${
            selected === null ? "border-champagne bg-champagne/10" : "border-dashed border-white/20 hover:border-champagne/60"
          }`}
        >
          <span className="font-display text-5xl italic text-gold">✦</span>
          <span className="mt-4 font-display text-2xl leading-tight">Sin preferencia</span>
          <span className="mt-1 text-xs text-ivory/50">Más horarios disponibles</span>
        </button>
        {team.map((t, i) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`group relative aspect-[3/4] overflow-hidden rounded-2xl border text-left transition ${
              selected === t.id ? "border-champagne ring-2 ring-champagne/40" : "border-white/10 hover:border-white/30"
            }`}
          >
            <Portrait name={t.name} photo={t.photo_url} index={i} />
            <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 p-4">
              <span className="eyebrow block text-[0.58rem] text-champagne">{t.role}</span>
              <span className="mt-1 block font-display text-xl leading-tight">{t.name}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepDateTime({
  locationId,
  serviceIds,
  staffId,
  date,
  setDate,
  slot,
  setSlot,
  team,
}: {
  locationId: number;
  serviceIds: number[];
  staffId: number | null;
  date: string | null;
  setDate: (d: string) => void;
  slot: Slot | null;
  setSlot: (s: Slot) => void;
  team: PublicStaff[];
}) {
  const [days, setDays] = useState<{ date: string; count: number }[] | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const qs = `location=${locationId}&services=${serviceIds.join(",")}${staffId ? `&staff=${staffId}` : ""}`;

  useEffect(() => {
    let alive = true;
    setDays(null);
    fetch(`/api/availability?${qs}&days=28`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setDays(d.days);
        if (!date || !d.days.some((x: { date: string; count: number }) => x.date === date && x.count)) {
          const first = d.days.find((x: { count: number }) => x.count);
          if (first) setDate(first.date);
        }
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  useEffect(() => {
    if (!date) return;
    let alive = true;
    setSlots(null);
    fetch(`/api/availability?${qs}&date=${date}`)
      .then((r) => r.json())
      .then((d) => alive && setSlots(d.slots));
    return () => {
      alive = false;
    };
  }, [qs, date]);

  const groups = slots
    ? [
        { label: "Mañana", items: slots.filter((s) => s.start < 720) },
        { label: "Tarde", items: slots.filter((s) => s.start >= 720 && s.start < 1020) },
        { label: "Noche", items: slots.filter((s) => s.start >= 1020) },
      ].filter((g) => g.items.length)
    : [];

  return (
    <div>
      <h1 className="font-display text-5xl leading-none md:text-6xl">
        ¿<em className="text-gold">Cuándo</em> te vemos?
      </h1>
      <p className="mt-3 text-ivory/60">Solo mostramos horarios realmente disponibles.</p>

      <div className="no-scrollbar -mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
        {!days &&
          Array.from({ length: 10 }, (_, i) => <div key={i} className="h-24 w-16 shrink-0 animate-pulse rounded-2xl bg-white/5" />)}
        {days?.map((d) => {
          const dt = new Date(d.date + "T12:00:00Z");
          const on = d.date === date;
          return (
            <button
              key={d.date}
              disabled={!d.count}
              onClick={() => setDate(d.date)}
              className={`relative flex h-24 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border transition ${
                on ? "border-champagne bg-champagne text-ink" : d.count ? "border-white/10 hover:border-white/30" : "border-transparent text-ivory/20"
              }`}
            >
              <span className="text-[0.65rem] uppercase tracking-widest">{WEEKDAY_SHORT[dt.getUTCDay()]}</span>
              <span className="font-display text-2xl">{dt.getUTCDate()}</span>
              <span className="text-[0.6rem] opacity-60">{dt.toLocaleDateString("es-CO", { month: "short", timeZone: "UTC" })}</span>
              {!!d.count && !on && <span className="absolute bottom-2 h-1 w-1 rounded-full bg-champagne" />}
            </button>
          );
        })}
      </div>
      {days && !days.some((d) => d.count) && (
        <p className="mt-6 text-ivory/60">No hay horarios en las próximas semanas con esta combinación. Prueba “sin preferencia” o escríbenos por WhatsApp.</p>
      )}

      <div className="mt-10 min-h-40">
        {date && <p className="mb-6 font-display text-2xl first-letter:uppercase">{longDate(date)}</p>}
        {date && !slots && <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{Array.from({ length: 10 }, (_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />)}</div>}
        {slots && !slots.length && <p className="text-ivory/60">Este día ya está completo. Elige otra fecha.</p>}
        <div className="space-y-8">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="eyebrow mb-3 text-ivory/40">{g.label}</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-6">
                {g.items.map((s, i) => {
                  const on = slot?.start === s.start;
                  return (
                    <motion.button
                      key={s.start}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.015 }}
                      onClick={() => setSlot(s)}
                      className={`rounded-xl border py-3 text-sm transition ${on ? "border-champagne bg-champagne font-semibold text-ink" : "border-white/10 hover:border-champagne/60"}`}
                    >
                      {s.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {slot && !staffId && (
          <p className="mt-6 text-xs text-ivory/40">
            Disponibles a esta hora: {slot.staffIds.map((id) => team.find((t) => t.id === id)?.name.split(" ")[0]).filter(Boolean).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

function StepDetails({
  form,
  setForm,
  consent,
  setConsent,
}: {
  form: { name: string; phone: string; email: string; notes: string };
  setForm: (f: { name: string; phone: string; email: string; notes: string }) => void;
  consent: boolean;
  setConsent: (b: boolean) => void;
}) {
  const field = "w-full border-b border-white/15 bg-transparent py-3 text-lg outline-none transition placeholder:text-ivory/25 focus:border-champagne";
  return (
    <div>
      <h1 className="font-display text-5xl leading-none md:text-6xl">
        Casi <em className="text-gold">listo</em>
      </h1>
      <p className="mt-3 text-ivory/60">Te enviaremos la confirmación y los recordatorios por WhatsApp.</p>
      <div className="mt-10 grid max-w-2xl gap-8 md:grid-cols-2">
        <label className="md:col-span-2">
          <span className="eyebrow text-ivory/50">Nombre y apellido *</span>
          <input autoComplete="name" className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="¿Cómo te llamas?" />
        </label>
        <label>
          <span className="eyebrow text-ivory/50">Celular (WhatsApp) *</span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={field}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="300 123 4567"
          />
        </label>
        <label>
          <span className="eyebrow text-ivory/50">Correo (opcional)</span>
          <input type="email" autoComplete="email" className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="tu@correo.com" />
        </label>
        <label className="md:col-span-2">
          <span className="eyebrow text-ivory/50">¿Algo que debamos saber?</span>
          <textarea
            rows={2}
            className={field + " resize-none"}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Largo de tu cabello, referencia de color, alergias…"
          />
        </label>
        <label className="flex items-start gap-3 text-sm text-ivory/60 md:col-span-2">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 accent-[#c9a877]" />
          Acepto recibir la confirmación y recordatorios de mi cita por WhatsApp y el tratamiento de mis datos para gestionar la reserva.
        </label>
      </div>
    </div>
  );
}

function Success({ created, services, location }: { created: Created; services: string[]; location?: PublicLocation }) {
  const toGcal = (d: string, m: number) => `${d.replace(/-/g, "")}T${String(Math.floor(m / 60)).padStart(2, "0")}${String(m % 60).padStart(2, "0")}00`;
  const gcal =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent("Cita en Infante Hair Stylist")}` +
    `&dates=${toGcal(created.date, created.start)}/${toGcal(created.date, created.end)}&ctz=America/Bogota` +
    `&details=${encodeURIComponent(services.join(" + ") + " con " + created.staff.name + "\nCódigo " + created.code)}` +
    `&location=${encodeURIComponent(location?.address ?? "")}`;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-32 pt-8 text-center">
      <motion.svg viewBox="0 0 120 120" className="mx-auto h-28 w-28" initial="h" animate="v">
        <motion.circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="#c9a877"
          strokeWidth="1.5"
          variants={{ h: { pathLength: 0 }, v: { pathLength: 1 } }}
          transition={{ duration: 1.2, ease: EASE }}
        />
        <motion.path
          d="M38 62 L54 77 L84 44"
          fill="none"
          stroke="#e2c9a0"
          strokeWidth="3"
          strokeLinecap="round"
          variants={{ h: { pathLength: 0 }, v: { pathLength: 1 } }}
          transition={{ duration: 0.7, delay: 0.9, ease: EASE }}
        />
      </motion.svg>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 1, ease: EASE }}>
        <p className="eyebrow mt-8 text-champagne">{created.status === "pending" ? "Solicitud recibida" : "Cita confirmada"}</p>
        <h1 className="mt-4 font-display text-5xl leading-tight md:text-7xl">
          ¡Te <em className="text-gold">esperamos</em>!
        </h1>
        <p className="mt-4 font-display text-3xl first-letter:uppercase md:text-4xl">{longDate(created.date)}</p>
        <p className="mt-4 text-xl text-ivory/70">
          {created.time} · con {created.staff.name}
        </p>
        <p className="mt-2 text-ivory/50">{services.join(" + ")}</p>
        <div className="mx-auto mt-10 inline-flex items-center gap-4 rounded-full border border-white/15 px-6 py-3">
          <span className="eyebrow text-ivory/50">Código</span>
          <span className="font-mono text-lg tracking-widest text-gold">{created.code}</span>
        </div>
        <p className="mx-auto mt-6 max-w-md text-sm text-ivory/50">
          Te enviamos la confirmación por WhatsApp. Un día antes y el mismo día te recordaremos tu cita.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a href={gcal} target="_blank" rel="noreferrer" className="rounded-full bg-ivory px-6 py-3 text-sm font-semibold text-ink hover:bg-champagne">
            Agregar a mi calendario
          </a>
          <Link href={`/reserva/${created.code}`} className="rounded-full border border-white/20 px-6 py-3 text-sm hover:border-champagne">
            Gestionar mi cita
          </Link>
          {location?.maps_url && (
            <a href={location.maps_url} target="_blank" rel="noreferrer" className="rounded-full border border-white/20 px-6 py-3 text-sm hover:border-champagne">
              Cómo llegar ↗
            </a>
          )}
        </div>
      </motion.div>
    </div>
  );
}
