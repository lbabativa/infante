import fs from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/uploads";

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif" };

export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const name = path.basename((await ctx.params).file);
  const type = TYPES[path.extname(name).toLowerCase()];
  if (!type) return new Response("No encontrado", { status: 404 });
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, name));
    return new Response(data, { headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
