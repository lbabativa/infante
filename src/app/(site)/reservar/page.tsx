import type { Metadata } from "next";
import { BookingWizard } from "@/components/site/BookingWizard";
import { publicCatalog, publicLocations, publicTeam } from "@/lib/public-data";

export const metadata: Metadata = { title: "Reservar cita", description: "Agenda tu cita en Infante Hair Stylist en menos de un minuto." };

export default async function ReservarPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <div className="pt-32">
      <BookingWizard
        categories={publicCatalog()}
        team={publicTeam()}
        locations={publicLocations()}
        initial={{
          serviceId: Number(sp.servicio) || undefined,
          staffId: Number(sp.especialista) || undefined,
          locationId: Number(sp.sede) || undefined,
        }}
      />
    </div>
  );
}
