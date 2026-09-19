import { catalogHandler } from "@/lib/api-handlers";
import { guard } from "../guard";

export const dynamic = "force-dynamic";
export const GET = guard(() => catalogHandler());
