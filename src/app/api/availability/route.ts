import { availabilityHandler } from "@/lib/api-handlers";

export const dynamic = "force-dynamic";
export const GET = (req: Request) => availabilityHandler(req);
