import { hhmm, WEEKDAY_NAMES } from "@/lib/format";
import { STATUS_LABEL, type BookingStatus, type Hours } from "@/lib/repo";

export function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl leading-none md:text-5xl">{title}</h1>
        {sub && <p className="mt-2 text-sm text-[#7a6f62] first-letter:uppercase">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-stone-200 text-stone-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-orange-100 text-orange-800",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}

export const STATUS_BLOCK: Record<BookingStatus, string> = {
  pending: "bg-amber-50 border-amber-400 text-amber-950",
  confirmed: "bg-[#fbf6ee] border-[#a8864f] text-[#2a2119]",
  completed: "bg-stone-100 border-stone-400 text-stone-600",
  cancelled: "bg-red-50 border-red-300 text-red-800 line-through opacity-60",
  no_show: "bg-orange-50 border-orange-400 text-orange-900",
};

/** Editor de horario semanal (inputs d{n}_on / d{n}_start / d{n}_end). */
export function HoursEditor({ hours }: { hours: Hours }) {
  return (
    <div className="divide-y divide-[#efe8dd] rounded-xl border border-[#e7dfd3]">
      {[1, 2, 3, 4, 5, 6, 0].map((d) => {
        const h = hours[d];
        return (
          <div key={d} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
            <label className="flex w-32 items-center gap-2 capitalize">
              <input type="checkbox" name={`d${d}_on`} defaultChecked={!!h} className="accent-[#a8864f]" />
              {WEEKDAY_NAMES[d]}
            </label>
            <input type="time" name={`d${d}_start`} defaultValue={h ? hhmm(h[0]) : "08:00"} className="input !w-auto !py-1" />
            <span className="text-[#9a8f80]">a</span>
            <input type="time" name={`d${d}_end`} defaultValue={h ? hhmm(h[1]) : "19:00"} className="input !w-auto !py-1" />
          </div>
        );
      })}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-[#ddd3c4] p-8 text-center text-sm text-[#7a6f62]">{children}</p>;
}
