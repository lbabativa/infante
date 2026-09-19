import "server-only";
import { getSettings } from "./db";
import { catalog, listLocations, listStaff } from "./repo";
import type { PublicCategory, PublicLocation, PublicStaff } from "./public-types";

export async function publicCatalog(): Promise<PublicCategory[]> {
  return (await catalog()).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    services: c.services.map(({ id, name, description, duration_min, price, price_from, featured }) => ({
      id,
      name,
      description,
      duration_min,
      price,
      price_from,
      featured,
    })),
  }));
}

export async function publicTeam(): Promise<PublicStaff[]> {
  return (await listStaff()).map(({ id, slug, name, role, bio, photo_url, instagram, location_id, service_ids, bookable }) => ({
    id,
    slug,
    name,
    role,
    bio,
    photo_url,
    instagram,
    location_id,
    service_ids,
    bookable,
  }));
}

export async function publicLocations(): Promise<PublicLocation[]> {
  return (await listLocations()).map(({ id, name, address, city, whatsapp, maps_url, hours, active, coming_soon }) => ({
    id,
    name,
    address,
    city,
    whatsapp,
    maps_url,
    hours,
    active,
    coming_soon,
  }));
}

export async function contact() {
  const s = await getSettings();
  return { whatsapp: s.salon_whatsapp, instagram: s.instagram_url };
}
