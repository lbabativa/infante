import "server-only";
import { getSetting } from "./db";
import { catalog, listLocations, listStaff } from "./repo";
import type { PublicCategory, PublicLocation, PublicStaff } from "./public-types";

export function publicCatalog(): PublicCategory[] {
  return catalog().map((c) => ({
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

export function publicTeam(): PublicStaff[] {
  return listStaff().map(({ id, slug, name, role, bio, photo_url, instagram, location_id, service_ids, bookable }) => ({
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

export function publicLocations(): PublicLocation[] {
  return listLocations().map(({ id, name, address, city, whatsapp, maps_url, hours, active, coming_soon }) => ({
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

export function contact() {
  return { whatsapp: getSetting("salon_whatsapp"), instagram: getSetting("instagram_url") };
}
