import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0c0b0a] p-12 text-[#f4efe7] lg:flex">
        <div className="absolute -bottom-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,#c9a87740,transparent_65%)]" />
        <p className="font-display text-2xl tracking-[0.3em]">INFANTE</p>
        <div className="relative">
          <p className="font-display text-6xl leading-none">
            Tu agenda,
            <br />
            <em className="text-[#e2c9a0]">en orden.</em>
          </p>
          <p className="mt-6 max-w-sm text-sm text-[#b9ad9c]">Citas, equipo, servicios y mensajes automáticos en un solo lugar.</p>
        </div>
        <p className="text-xs text-[#f4efe7]/40">Panel desarrollado por StartIA</p>
      </div>
      <div className="flex items-center justify-center p-8">
        <LoginForm />
      </div>
    </div>
  );
}
