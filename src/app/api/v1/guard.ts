import { NextResponse } from "next/server";
import { checkApiKey } from "@/lib/auth";

/** Protege la API de integraciones (NovaCall, CRMs, bots) con INTEGRATION_API_KEY. */
export function guard<A extends unknown[]>(fn: (req: Request, ...args: A) => Response | Promise<Response>) {
  return async (req: Request, ...args: A) => {
    if (!checkApiKey(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    return fn(req, ...args);
  };
}
