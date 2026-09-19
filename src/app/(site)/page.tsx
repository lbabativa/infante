import { Hero } from "@/components/site/Hero";
import { Manifesto } from "@/components/site/Manifesto";
import { Marquee } from "@/components/site/Marquee";
import { Brands, FinalCTA, Locations, Steps } from "@/components/site/Sections";
import { ServicesShowcase } from "@/components/site/ServicesShowcase";
import { TeamGallery } from "@/components/site/TeamGallery";
import { publicCatalog, publicLocations, publicTeam } from "@/lib/public-data";

export default async function Home() {
  const [categories, team, locations] = await Promise.all([publicCatalog(), publicTeam(), publicLocations()]);
  const serviceCount = categories.reduce((a, c) => a + c.services.length, 0);

  return (
    <>
      <Hero />
      <Marquee />
      <Manifesto team={team.length} services={Math.floor(serviceCount / 10) * 10} />
      <ServicesShowcase categories={categories} />
      <TeamGallery team={team} />
      <Brands />
      <Steps />
      <Locations locations={locations} />
      <FinalCTA />
    </>
  );
}
