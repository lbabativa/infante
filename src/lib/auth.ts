import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "infante_admin";
const MAX_AGE = 60 * 60 * 12; // 12 horas

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("Falta SESSION_SECRET");
  return s || "dev-secret-infante";
}

export function adminPassword() {
  const p = process.env.ADMIN_PASSWORD;
  if (!p && process.env.NODE_ENV === "production") throw new Error("Falta ADMIN_PASSWORD");
  return p || "infante2026";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(input: string) {
  return safeEqual(sign(input), sign(adminPassword()));
}

export async function startSession() {
  const exp = String(Date.now() + MAX_AGE * 1000);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  return !!exp && !!sig && safeEqual(sig, sign(exp)) && Number(exp) > Date.now();
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** Para integraciones (NovaCall, etc.): Authorization: Bearer <INTEGRATION_API_KEY> */
export function checkApiKey(req: Request) {
  const key = process.env.INTEGRATION_API_KEY;
  const got = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return !!key && safeEqual(got, key);
}
