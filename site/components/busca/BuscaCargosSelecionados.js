"use client";

const CORES_AREA = {
  "dados-bi-analytics": "border-emerald-200 bg-emerald-50 text-emerald-950",
  desenvolvimento: "border-sky-200 bg-sky-50 text-sky-950",
  "engenharia-software": "border-indigo-200 bg-indigo-50 text-indigo-950",
  "marketing-growth": "border-orange-200 bg-orange-50 text-orange-950",
  "ia-ml": "border-violet-200 bg-violet-50 text-violet-950",
};

function chipClass(areaSlug) {
  return CORES_AREA[areaSlug] ?? "border-zinc-200 bg-zinc-50 text-zinc-900";
}

export default function BuscaCargosSelecionados({ alvos, onRemove }) {
  if (!alvos?.length) {
    return null;
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">Cargos selecionados</h2>
      <ul className="flex flex-wrap gap-2" role="list">
        {alvos.map((item) => {
          const areaSlug = item.chave.split("/")[0];

          return (
            <li key={item.chave}>
              <button
                type="button"
                onClick={() => onRemove(item.chave)}
                className={[
                  "group inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition hover:opacity-80",
                  chipClass(areaSlug),
                ].join(" ")}
                title={`Remover ${item.titulo}`}
              >
                <span className="truncate">{item.titulo}</span>
                <span className="shrink-0 text-[10px] opacity-60 group-hover:opacity-100">×</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
