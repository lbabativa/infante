import { getBookingHandler } from "@/lib/api-handlers";
import { guard } from "../../guard";

export const GET = guard(async (_req: Request, ctx: { params: Promise<{ code: string }> }) => getBookingHandler((await ctx.params).code));
