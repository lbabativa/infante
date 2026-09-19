import { PageTitle } from "@/components/admin/ui";
import { bogotaNow } from "@/lib/format";
import { catalog, listLocations, listStaff } from "@/lib/repo";
import { NewBookingForm } from "./NewBookingForm";

export const metadata = { title: "Nueva cita" };

export default async function NuevaCitaPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const cats = catalog();
  return (
    <>
      <PageTitle title="Nueva cita" sub="Para citas tomadas por teléfono, WhatsApp o en recepción" />
      <NewBookingForm
        categories={cats.map((c) => ({ id: c.id, name: c.name, services: c.services.map((s) => ({ id: s.id, name: s.name, duration: s.duration_min })) }))}
        staff={listStaff().map((s) => ({ id: s.id, name: s.name }))}
        locations={listLocations().filter((l) => l.active).map((l) => ({ id: l.id, name: l.name }))}
        defaults={{ date: sp.fecha ?? bogotaNow().date, time: sp.hora ?? "", staffId: sp.especialista ?? "" }}
      />
    </>
  );
}
