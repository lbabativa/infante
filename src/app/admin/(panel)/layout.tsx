import { Sidebar } from "@/components/admin/Sidebar";
import { requireAdmin } from "@/lib/auth";
import { get } from "@/lib/db";
import { pendingManualCount } from "@/lib/notify";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const pending = get<{ n: number }>("SELECT COUNT(*) AS n FROM bookings WHERE status = 'pending'")?.n ?? 0;
  return (
    <div className="min-h-dvh">
      <Sidebar pendingMessages={pendingManualCount()} pendingBookings={pending} />
      <div className="lg:pl-60">
        <div className="mx-auto max-w-[1300px] p-5 md:p-10">{children}</div>
      </div>
    </div>
  );
}
