"use client";

const CORES_AREA = {
  "dados-bi-analytics": {
    chipAtivo: "border-emerald-500 bg-emerald-100 text-emerald-900 ring-1 ring-emerald-400",
    chipInativo: "border-emerald-200/80 bg-white/90 text-zinc-600 hover:border-emerald-300",
    chipDestaque: "ring-2 ring-amber-400 ring-offset-1",
  },
  desenvolvimento: {
    chipAtivo: "border-sky-500 bg-sky-100 text-sky-900 ring-1 ring-sky-400",
    chipInativo: "border-sky-200/80 bg-white/90 text-zinc-600 hover:border-sky-300",
    chipDestaque: "ring-2 ring-amber-400 ring-offset-1",
  },
  "engenharia-software": {
    chipAtivo: "border-indigo-500 bg-indigo-100 text-indigo-900 ring-1 ring-indigo-400",
    chipInativo: "border-indigo-200/80 bg-white/90 text-zinc-600 hover:border-indigo-300",
    chipDestaque: "ring-2 ring-amber-400 ring-offset-1",
  },
  "ia-ml": {
    chipAtivo: "border-violet-500 bg-violet-100 text-violet-900 ring-1 ring-violet-400",
    chipInativo: "border-violet-200/80 bg-white/90 text-zinc-600 hover:border-violet-300",
    chipDestaque: "ring-2 ring-amber-400 ring-offset-1",
  },
};

const COR_PADRAO = {
  chipAtivo: "border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-400",
  chipInativo: "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
  chipDestaque: "ring-2 ring-amber-400 ring-offset-1",
};

function temaArea(slug) {
  return CORES_AREA[slug] ?? COR_PADRAO;
}

function TituloChip({ titulo, ativo, destacado, tema, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(titulo.chave)}
      aria-pressed={ativo}
      className={[
        "rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium shadow-sm transition",
        ativo ? tema.chipAtivo : tema.chipInativo,
        destacado ? tema.chipDestaque : "",
      ].join(" ")}
    >
      {titulo.titulo}
    </button>
  );
}

function QuadroArea({ area, chavesAtivas, highlightChaves, onToggle }) {
  const tema = temaArea(area.slug);

  return (
    <article id={`busca-area-${area.slug}`} className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-900">{area.nome}</h3>
      {area.nichos.map((nicho) => (
        <div key={nicho.id}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            {nicho.nome}
          </p>
          <ul className="flex flex-wrap gap-2" role="list">
            {nicho.titulos.map((titulo) => (
              <li key={titulo.chave}>
                <TituloChip
                  titulo={titulo}
                  ativo={chavesAtivas.has(titulo.chave)}
                  destacado={highlightChaves?.has(titulo.chave)}
                  tema={tema}
                  onToggle={onToggle}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </article>
  );
}

export default function BuscaCatalogo({
  catalogo,
  chavesAtivas,
  highlightChaves,
  onToggle,
  buscando = false,
}) {
  if (!catalogo?.length) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">Cargos</h2>
      <div className="rounded-xl border border-zinc-200 bg-[radial-gradient(circle_at_1px_1px,rgb(228_228_231)_1px,transparent_0)] [background-size:18px_18px] p-3 sm:p-4">
        {buscando && !catalogo.some((a) => a.nichos?.some((n) => n.titulos?.length)) ? (
          <p className="py-4 text-center text-sm text-zinc-500">Nenhum cargo encontrado.</p>
        ) : (
          <div className="space-y-6">
            {catalogo.map((area) => (
              <QuadroArea
                key={area.slug}
                area={area}
                chavesAtivas={chavesAtivas}
                highlightChaves={highlightChaves}
                onToggle={onToggle}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
