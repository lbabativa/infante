import { availabilityHandler } from "@/lib/api-handlers";
import { guard } from "../guard";

export const dynamic = "force-dynamic";
export const GET = guard((req: Request) => availabilityHandler(req));
