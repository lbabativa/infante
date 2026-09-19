// Tipos serializables que viajan de servidor a componentes cliente.

export type PublicService = {
  id: number;
  name: string;
  description: string | null;
  duration_min: number;
  price: number | null;
  price_from: number;
  featured: number;
};

export type PublicCategory = {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  services: PublicService[];
};

export type PublicStaff = {
  id: number;
  slug: string;
  name: string;
  role: string | null;
  bio: string | null;
  photo_url: string | null;
  instagram: string | null;
  location_id: number | null;
  service_ids: number[];
  bookable: number;
};

export type PublicLocation = {
  id: number;
  name: string;
  address: string;
  city: string;
  whatsapp: string | null;
  maps_url: string | null;
  hours: Record<number, [number, number] | null>;
  active: number;
  coming_soon: number;
};
