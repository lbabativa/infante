import { changeStatus } from "@/app/admin/actions";
import type { BookingStatus } from "@/lib/repo";

const NEXT: Record<BookingStatus, { status: BookingStatus; label: string; ghost?: boolean }[]> = {
  pending: [
    { status: "confirmed", label: "Confirmar" },
    { status: "cancelled", label: "Rechazar", ghost: true },
  ],
  confirmed: [
    { status: "completed", label: "Atendida" },
    { status: "no_show", label: "No asistió", ghost: true },
    { status: "cancelled", label: "Cancelar", ghost: true },
  ],
  completed: [],
  cancelled: [{ status: "confirmed", label: "Reactivar", ghost: true }],
  no_show: [{ status: "completed", label: "Marcar atendida", ghost: true }],
};

/** Botones rápidos de cambio de estado (cada cambio dispara su mensaje automático). */
export function BookingActions({ id, status, size = "sm" }: { id: number; status: BookingStatus; size?: "sm" | "md" }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {NEXT[status].map((n) => (
        <form key={n.status} action={changeStatus}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={n.status} />
          <button className={`btn ${size === "sm" ? "btn-sm" : ""} ${n.ghost ? "btn-ghost" : ""}`}>{n.label}</button>
        </form>
      ))}
    </div>
  );
}
