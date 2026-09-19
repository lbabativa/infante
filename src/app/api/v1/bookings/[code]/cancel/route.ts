import { cancelBookingHandler } from "@/lib/api-handlers";
import { guard } from "../../../guard";

export const POST = guard(async (_req: Request, ctx: { params: Promise<{ code: string }> }) => cancelBookingHandler((await ctx.params).code));
