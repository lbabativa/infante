import { createBookingHandler } from "@/lib/api-handlers";
import { guard } from "../guard";

// body.source puede ser "novacall" para identificar citas creadas por el agente de voz.
export const POST = guard((req: Request) => createBookingHandler(req, "api"));
