"use client";
import { AnimatePresence, motion } from "motion/react";
import { useActionState } from "react";
import { apply, type ApplyState } from "./actions";

const ROLES = ["Estilista / Hair stylist", "Colorista", "Barbero", "Manicurista", "Maquillador(a)", "Recepción / Coordinación", "Auxiliar"];

export function ApplyForm() {
  const [state, action, pending] = useActionState<ApplyState, FormData>(apply, { ok: false });
  const field = "w-full border-b border-white/15 bg-transparent py-3 text-lg outline-none transition placeholder:text-ivory/25 focus:border-champagne";

  return (
    <AnimatePresence mode="wait">
      {state.ok ? (
        <motion.div key="ok" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-champagne/40 p-10">
          <p className="font-display text-5xl">
            ¡Gracias! <em className="text-gold">Te leemos.</em>
          </p>
          <p className="mt-4 text-ivory/60">Recibimos tu postulación. Si tu perfil encaja, te contactaremos por WhatsApp.</p>
        </motion.div>
      ) : (
        <motion.form key="form" action={action} exit={{ opacity: 0 }} className="grid gap-8 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="eyebrow text-ivory/50">Nombre completo *</span>
            <input name="name" required className={field} />
          </label>
          <label>
            <span className="eyebrow text-ivory/50">Celular *</span>
            <input name="phone" type="tel" required className={field} placeholder="300 123 4567" />
          </label>
          <label>
            <span className="eyebrow text-ivory/50">Correo</span>
            <input name="email" type="email" className={field} />
          </label>
          <label>
            <span className="eyebrow text-ivory/50">Cargo *</span>
            <select name="role" required defaultValue="" className={field + " [&>option]:bg-coal"}>
              <option value="" disabled>
                Elige…
              </option>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="eyebrow text-ivory/50">Años de experiencia</span>
            <select name="experience" defaultValue="" className={field + " [&>option]:bg-coal"}>
              <option value="">—</option>
              {["Menos de 1", "1 – 3", "3 – 5", "5 – 10", "Más de 10"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="eyebrow text-ivory/50">Instagram o portafolio</span>
            <input name="instagram" className={field} placeholder="@tuusuario o enlace" />
          </label>
          <label className="md:col-span-2">
            <span className="eyebrow text-ivory/50">Cuéntanos de ti</span>
            <textarea name="message" rows={3} className={field + " resize-none"} placeholder="Tu especialidad, dónde has trabajado, qué te mueve…" />
          </label>
          {state.error && <p className="text-sm text-blush md:col-span-2">{state.error}</p>}
          <div className="md:col-span-2">
            <button disabled={pending} className="rounded-full bg-ivory px-8 py-4 text-sm font-semibold text-ink transition hover:bg-champagne disabled:opacity-50">
              {pending ? "Enviando…" : "Enviar postulación →"}
            </button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
