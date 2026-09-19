import { cancelBookingHandler } from "@/lib/api-handlers";

export async function POST(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  return cancelBookingHandler((await ctx.params).code);
}
