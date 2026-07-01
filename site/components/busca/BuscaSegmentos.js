"use client";

const CORES_AREA = {
  "dados-bi-analytics": {
    fundo: "bg-emerald-50/50",
    cabecalho: "bg-emerald-100/80 text-emerald-950",
    ativo: "border-emerald-500 ring-2 ring-emerald-400",
    inativo: "border-emerald-200/80 hover:border-emerald-300",
    nicho: "text-emerald-900/80",
  },
  desenvolvimento: {
    fundo: "bg-sky-50/40",
    cabecalho: "bg-sky-100/80 text-sky-950",
    ativo: "border-sky-500 ring-2 ring-sky-400",
    inativo: "border-sky-200/80 hover:border-sky-300",
    nicho: "text-sky-900/80",
  },
  "engenharia-software": {
    fundo: "bg-indigo-50/40",
    cabecalho: "bg-indigo-100/80 text-indigo-950",
    ativo: "border-indigo-500 ring-2 ring-indigo-400",
    inativo: "border-indigo-200/80 hover:border-indigo-300",
    nicho: "text-indigo-900/80",
  },
  "ia-ml": {
    fundo: "bg-violet-50/40",
    cabecalho: "bg-violet-100/80 text-violet-950",
    ativo: "border-violet-500 ring-2 ring-violet-400",
    inativo: "border-violet-200/80 hover:border-violet-300",
    nicho: "text-violet-900/80",
  },
};

const COR_PADRAO = {
  fundo: "bg-zinc-50/50",
  cabecalho: "bg-zinc-100 text-zinc-900",
  ativo: "border-emerald-500 ring-2 ring-emerald-400",
  inativo: "border-zinc-200 hover:border-zinc-300",
  nicho: "text-zinc-700",
};

function temaArea(slug) {
  return CORES_AREA[slug] ?? COR_PADRAO;
}

function nichosComCargos(area, chavesAtivas) {
  return (area.nichos ?? [])
    .map((nicho) => {
      const titulos = (nicho.titulos ?? []).filter((t) => chavesAtivas.has(t.chave));
      return titulos.length ? { ...nicho, titulosSelecionados: titulos } : null;
    })
    .filter(Boolean);
}

export default function BuscaSegmentos({
  catalogo,
  segmentosAtivos,
  titulosAtivos,
  onToggle,
}) {
  const chavesAtivas = new Set(titulosAtivos ?? []);
  const segmentosSet = new Set(segmentosAtivos ?? []);

  const areasComCargos = (catalogo ?? [])
    .map((area) => ({ area, nichos: nichosComCargos(area, chavesAtivas) }))
    .filter(({ nichos }) => nichos.length);

  if (!areasComCargos.length) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">Segmentos</h2>
      <div className="space-y-3">
        {areasComCargos.map(({ area, nichos }) => {
          const tema = temaArea(area.slug);
          const ativo = segmentosSet.has(area.slug);

          return (
            <div
              key={area.slug}
              className={[
                "rounded-2xl border-2 p-4 transition",
                tema.fundo,
                ativo ? tema.ativo : `${tema.inativo} opacity-55`,
              ].join(" ")}
            >
              <button
                type="button"
                aria-pressed={ativo}
                onClick={() => onToggle(area.slug)}
                className="mb-3 w-full text-left"
              >
                <p className={`inline-block rounded-lg px-2 py-1 text-sm font-semibold ${tema.cabecalho}`}>
                  {area.nome}
                </p>
              </button>

              <div className="space-y-3 pl-1">
                {nichos.map((nicho) => (
                  <div key={nicho.id}>
                    <p className={`mb-1.5 text-[10px] font-semibold uppercase tracking-wide ${tema.nicho}`}>
                      {nicho.nome}
                    </p>
                    <ul className="flex flex-wrap gap-1.5" role="list">
                      {nicho.titulosSelecionados.map((titulo) => (
                        <li
                          key={titulo.chave}
                          className="rounded-md border border-white/60 bg-white/70 px-2 py-1 text-xs text-zinc-800"
                        >
                          {titulo.titulo}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function segmentosFromTitulos(titulosAtivos) {
  return [...new Set((titulosAtivos ?? []).map((chave) => chave.split("/")[0]).filter(Boolean))];
}
