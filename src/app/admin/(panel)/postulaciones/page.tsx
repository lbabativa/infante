import { setApplicationStatus } from "@/app/admin/actions";
import { Empty, PageTitle } from "@/components/admin/ui";
import { col, NO_ID } from "@/lib/db";
import { prettyPhone } from "@/lib/format";
import { waLink } from "@/lib/notify";

export const metadata = { title: "Postulaciones" };

type App = { id: number; name: string; phone: string; email: string | null; role: string; experience: string; instagram: string; message: string; status: string; created_at: string };
const STATES = ["nueva", "contactada", "entrevista", "contratada", "descartada"];

export default async function PostulacionesPage() {
  const apps = await (await col<App>("applications")).find({}, NO_ID).sort({ id: -1 }).toArray();
  return (
    <>
      <PageTitle title="Postulaciones" sub="Recibidas desde “Únete a nuestro equipo”" />
      {apps.length === 0 ? (
        <Empty>Aún no hay postulaciones.</Empty>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {apps.map((a) => (
            <li key={a.id} className="card space-y-2 p-5 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">{a.name}</p>
                  <p className="text-[#7a6f62]">
                    {a.role}
                    {a.experience && ` · ${a.experience} años`}
                  </p>
                </div>
                <form action={setApplicationStatus} className="flex gap-1">
                  <input type="hidden" name="id" value={a.id} />
                  <select name="status" defaultValue={a.status} className="input !w-auto !py-1 !text-xs">
                    {STATES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <button className="btn btn-ghost btn-sm">OK</button>
                </form>
              </div>
              {a.message && <p className="whitespace-pre-line text-[#3d352d]">{a.message}</p>}
              <p className="text-xs text-[#7a6f62]">
                {prettyPhone(a.phone)} {a.email && `· ${a.email}`} {a.instagram && `· ${a.instagram}`} · {a.created_at.slice(0, 10)}
              </p>
              <a href={waLink(a.phone, `Hola ${a.name.split(" ")[0]}, te escribimos de Infante Hair Stylist por tu postulación ✨`)} target="_blank" rel="noreferrer" className="btn btn-sm">
                Escribir por WhatsApp
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
