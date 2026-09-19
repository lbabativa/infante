import { getUpload } from "@/lib/uploads";

export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const media = await getUpload((await ctx.params).file);
  if (!media) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(media.data.buffer), {
    headers: { "Content-Type": media.type, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
