import { getBookingHandler } from "@/lib/api-handlers";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  return getBookingHandler((await ctx.params).code);
}
