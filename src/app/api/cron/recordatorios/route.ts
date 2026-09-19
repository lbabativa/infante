import { NextResponse } from "next/server";
import { runAutomations } from "@/lib/notify";

export const dynamic = "force-dynamic";

/**
 * Recordatorios 24 h / mismo día y mensajes de agradecimiento.
 * Programar cada 15 min (vercel.json, cron del servidor o cualquier scheduler):
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const sent = await runAutomations();
  return NextResponse.json({ ok: true, sent });
}
