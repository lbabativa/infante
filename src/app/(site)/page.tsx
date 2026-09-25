import { Hero } from "@/components/site/Hero";
import { Locations, Steps } from "@/components/site/Sections";
import { ServicesShowcase } from "@/components/site/ServicesShowcase";
import { TeamGallery } from "@/components/site/TeamGallery";
import { publicCatalog, publicLocations, publicTeam } from "@/lib/public-data";

export default async function Home() {
  const [categories, team, locations] = await Promise.all([publicCatalog(), publicTeam(), publicLocations()]);

  return (
    <>
      <Hero />
      <TeamGallery team={team} />
      <Steps />
      <ServicesShowcase categories={categories} />
      <Locations locations={locations} />
    </>
  );
}
