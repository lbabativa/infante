import { createBookingHandler } from "@/lib/api-handlers";

export const POST = (req: Request) => createBookingHandler(req, "web");
