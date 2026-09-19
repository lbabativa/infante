import { Footer } from "@/components/site/Footer";
import { Nav } from "@/components/site/Nav";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";
import { contact } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const c = await contact();
  return (
    <div className="grain relative">
      <Nav />
      <main>{children}</main>
      <Footer whatsapp={c.whatsapp} instagram={c.instagram} />
      <WhatsAppFab phone={c.whatsapp} />
    </div>
  );
}
