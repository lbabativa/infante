"use server";
import { z } from "zod";
import { run } from "@/lib/db";
import { normalizePhone } from "@/lib/format";

const schema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre"),
  phone: z.string().trim().refine((p) => normalizePhone(p).length >= 11, "Celular no válido"),
  email: z.union([z.literal(""), z.string().email("Correo no válido")]),
  role: z.string().trim().min(1, "Elige un cargo"),
  experience: z.string().trim().max(40),
  instagram: z.string().trim().max(80),
  message: z.string().trim().max(1500),
});

export type ApplyState = { ok: boolean; error?: string };

export async function apply(_prev: ApplyState, fd: FormData): Promise<ApplyState> {
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  run(
    "INSERT INTO applications (name, phone, email, role, experience, instagram, message) VALUES (?,?,?,?,?,?,?)",
    d.name,
    normalizePhone(d.phone),
    d.email || null,
    d.role,
    d.experience,
    d.instagram,
    d.message
  );
  return { ok: true };
}
