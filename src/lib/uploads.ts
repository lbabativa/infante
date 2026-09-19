import "server-only";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

/** Guarda una foto subida desde el admin y devuelve su URL pública (/media/...). */
export async function saveUpload(file: File | null): Promise<string | null> {
  if (!file || !file.size) return null;
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED.has(ext)) throw new Error("Formato no permitido (usa JPG, PNG o WebP)");
  if (file.size > 6 * 1024 * 1024) throw new Error("La imagen supera 6 MB");
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/media/${name}`;
}
