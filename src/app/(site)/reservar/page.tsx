import type { Metadata } from "next";
import { BookingWizard } from "@/components/site/BookingWizard";
import { publicCatalog, publicLocations, publicTeam } from "@/lib/public-data";

export const metadata: Metadata = { title: "Reservar cita", description: "Agenda tu cita en Infante Hair Stylist en menos de un minuto." };

export default async function ReservarPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [categories, team, locations] = await Promise.all([publicCatalog(), publicTeam(), publicLocations()]);
  return (
    <div className="pt-32">
      <BookingWizard
        categories={categories}
        team={team}
        locations={locations}
        initial={{
          serviceId: Number(sp.servicio) || undefined,
          staffId: Number(sp.especialista) || undefined,
          locationId: Number(sp.sede) || undefined,
        }}
      />
    </div>
  );
}
