import "server-only";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Binary } from "mongodb";
import { col, nowIso } from "./db";

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif" };

export type Media = { name: string; type: string; data: Binary; created_at: string };

/** Guarda una foto subida desde el admin en MongoDB y devuelve su URL pública (/media/...). */
export async function saveUpload(file: File | null): Promise<string | null> {
  if (!file || !file.size) return null;
  const ext = path.extname(file.name).toLowerCase();
  const type = TYPES[ext];
  if (!type) throw new Error("Formato no permitido (usa JPG, PNG o WebP)");
  if (file.size > 6 * 1024 * 1024) throw new Error("La imagen supera 6 MB");
  const name = `${randomUUID()}${ext}`;
  await (await col<Media>("media")).insertOne({ name, type, data: new Binary(Buffer.from(await file.arrayBuffer())), created_at: nowIso() });
  return `/media/${name}`;
}

export async function getUpload(name: string) {
  return (await col<Media>("media")).findOne({ name });
}
