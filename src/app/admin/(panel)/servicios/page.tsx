import { saveCategory, saveService } from "@/app/admin/actions";
import { PageTitle } from "@/components/admin/ui";
import { listCategories, listServices, type Category, type Service } from "@/lib/repo";

export const metadata = { title: "Servicios" };

export default async function ServiciosAdmin() {
  const [cats, services] = await Promise.all([listCategories(), listServices({ includeInactive: true })]);
  return (
    <>
      <PageTitle title="Servicios" sub={`${services.filter((s) => s.active).length} activos · los cambios se ven al instante en el sitio`} />
      <div className="space-y-8">
        {cats.map((c) => (
          <section key={c.id} className="card p-5">
            <CategoryForm c={c} />
            <div className="mt-4 space-y-2">
              {services
                .filter((s) => s.category_id === c.id)
                .map((s) => (
                  <ServiceForm key={s.id} s={s} cats={cats} />
                ))}
              <details className="rounded-lg border border-dashed border-[#ddd3c4] p-3">
                <summary className="cursor-pointer text-sm font-semibold text-[#a8864f]">+ Agregar servicio a {c.name}</summary>
                <div className="mt-3">
                  <ServiceForm cats={cats} categoryId={c.id} />
                </div>
              </details>
            </div>
          </section>
        ))}
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Nueva categoría</h2>
          <CategoryForm />
        </section>
      </div>
    </>
  );
}

function CategoryForm({ c }: { c?: Category }) {
  return (
    <form action={saveCategory} className="flex flex-wrap items-end gap-3">
      {c && <input type="hidden" name="id" value={c.id} />}
      <label className="field min-w-48 flex-1">
        Categoría
        <input name="name" defaultValue={c?.name} required className={`input ${c ? "!text-lg !font-display" : ""}`} />
      </label>
      <label className="field min-w-64 flex-[2]">
        Frase
        <input name="tagline" defaultValue={c?.tagline ?? ""} className="input" />
      </label>
      <label className="field w-20">
        Orden
        <input name="sort" type="number" defaultValue={c?.sort ?? 99} className="input" />
      </label>
      <button className="btn btn-ghost btn-sm mb-1">{c ? "Guardar" : "Crear"}</button>
    </form>
  );
}

function ServiceForm({ s, cats, categoryId }: { s?: Service; cats: Category[]; categoryId?: number }) {
  const Wrap = s ? "details" : "div";
  return (
    <Wrap className={`group rounded-lg border border-[#efe8dd] ${s && !s.active ? "opacity-50" : ""}`}>
      {s && (
        <summary className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm">
          <span className="flex-1 font-medium">
            {s.name} {!!s.featured && <span className="text-[#a8864f]">★</span>} {!s.active && <span className="text-xs">(oculto)</span>}
          </span>
          <span className="text-[#7a6f62]">{s.duration_min} min</span>
          <span className="w-32 text-right">{s.price == null ? "Valoración" : `${s.price_from ? "desde " : ""}$${s.price.toLocaleString("es-CO")}`}</span>
        </summary>
      )}
      <form action={saveService} className="grid gap-3 border-t border-[#efe8dd] p-3 sm:grid-cols-6">
        {s && <input type="hidden" name="id" value={s.id} />}
        <label className="field sm:col-span-3">
          Nombre
          <input name="name" defaultValue={s?.name} required className="input" />
        </label>
        <label className="field">
          Precio (COP)
          <input name="price" defaultValue={s?.price ?? ""} placeholder="vacío = valoración" className="input" />
        </label>
        <label className="field">
          Duración (min)
          <input name="duration_min" type="number" step={15} min={15} defaultValue={s?.duration_min ?? 60} className="input" />
        </label>
        <label className="field">
          Categoría
          <select name="category_id" defaultValue={s?.category_id ?? categoryId} className="input">
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field sm:col-span-6">
          Descripción
          <textarea name="description" rows={2} defaultValue={s?.description ?? ""} className="input" />
        </label>
        <div className="flex flex-wrap items-center gap-5 text-sm sm:col-span-5">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="price_from" defaultChecked={!!s?.price_from} className="accent-[#a8864f]" /> Precio “desde”
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="featured" defaultChecked={!!s?.featured} className="accent-[#a8864f]" /> Destacado (firma)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="active" defaultChecked={s ? !!s.active : true} className="accent-[#a8864f]" /> Visible y reservable
          </label>
          <label className="flex items-center gap-2">
            Orden <input name="sort" type="number" defaultValue={s?.sort ?? 99} className="input !w-16 !py-1" />
          </label>
        </div>
        <button className="btn btn-sm justify-center">{s ? "Guardar" : "Agregar"}</button>
      </form>
    </Wrap>
  );
}
