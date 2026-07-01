"use client";

const CORES_RAIZ = {
  "area-dados": {
    borda: "border-emerald-300",
    fundo: "bg-emerald-50/50",
    cabecalho: "bg-emerald-100/80 text-emerald-950",
    tronco: "bg-emerald-300",
    ramoAtivo: "border-emerald-400 bg-emerald-100 text-emerald-900",
    ramoInativo: "border-emerald-200/60 bg-white/80 text-zinc-500",
  },
  "area-marketing": {
    borda: "border-violet-300",
    fundo: "bg-violet-50/40",
    cabecalho: "bg-violet-100/80 text-violet-950",
    tronco: "bg-violet-300",
    ramoAtivo: "border-violet-400 bg-violet-100 text-violet-900",
    ramoInativo: "border-violet-200/60 bg-white/80 text-zinc-500",
  },
  "area-ti": {
    borda: "border-sky-300",
    fundo: "bg-sky-50/40",
    cabecalho: "bg-sky-100/80 text-sky-950",
    tronco: "bg-sky-300",
    ramoAtivo: "border-sky-400 bg-sky-100 text-sky-900",
    ramoInativo: "border-sky-200/60 bg-white/80 text-zinc-500",
  },
  "area-produto": {
    borda: "border-amber-300",
    fundo: "bg-amber-50/40",
    cabecalho: "bg-amber-100/80 text-amber-950",
    tronco: "bg-amber-300",
    ramoAtivo: "border-amber-400 bg-amber-100 text-amber-900",
    ramoInativo: "border-amber-200/60 bg-white/80 text-zinc-500",
  },
};

const COR_PADRAO = {
  borda: "border-zinc-300",
  fundo: "bg-zinc-50/50",
  cabecalho: "bg-zinc-100 text-zinc-900",
  tronco: "bg-zinc-300",
  ramoAtivo: "border-emerald-400 bg-emerald-50 text-emerald-900",
  ramoInativo: "border-zinc-200 bg-white text-zinc-500",
};

function temaRaiz(id) {
  return CORES_RAIZ[id] ?? COR_PADRAO;
}

function RamoView({ filho, tema, destacado }) {
  return (
    <li
      className={[
        "rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition",
        filho.ativo ? tema.ramoAtivo : tema.ramoInativo,
        destacado ? "ring-2 ring-amber-400 ring-offset-1" : "",
      ].join(" ")}
    >
      {filho.nome}
    </li>
  );
}

function QuadroRaizView({ no, highlightIds, buscando }) {
  const tema = temaRaiz(no.id);
  const filhos = no.filhos ?? [];
  const raizAtiva = no.ativo || filhos.some((f) => f.ativo);
  const raizDestacada = buscando && highlightIds?.has(no.id);

  return (
    <article
      id={`busca-no-${no.id}`}
      className={[
        "flex min-h-[11rem] flex-col overflow-hidden rounded-2xl border-2 shadow-sm transition",
        tema.borda,
        tema.fundo,
        raizAtiva ? "opacity-100" : "opacity-55",
        raizDestacada ? "ring-2 ring-amber-400 ring-offset-2" : "",
      ].join(" ")}
    >
      <header
        className={[
          "flex items-center justify-center gap-2 px-4 py-3 text-center",
          tema.cabecalho,
        ].join(" ")}
      >
        <span
          className={[
            "h-2 w-2 shrink-0 rounded-full",
            raizAtiva ? "bg-emerald-500" : "bg-zinc-400",
          ].join(" ")}
        />
        <h3 className="text-sm font-semibold tracking-tight">{no.nome}</h3>
      </header>

      <div className="relative flex flex-1 flex-col px-3 pb-4 pt-1">
        {filhos.length ? (
          <>
            <div className={`mx-auto h-4 w-px ${tema.tronco}`} />
            <div className={`mx-6 mb-2 h-px ${tema.tronco}`} aria-hidden />
            <ul className="flex flex-1 flex-wrap content-start justify-center gap-2" role="list">
              {filhos.map((filho) => (
                <RamoView
                  key={filho.id}
                  filho={filho}
                  tema={tema}
                  destacado={buscando && highlightIds?.has(filho.id)}
                />
              ))}
            </ul>
          </>
        ) : (
          <p className="m-auto text-xs italic text-zinc-400">Sem ramos</p>
        )}
      </div>
    </article>
  );
}

export function BuscaArvoreView({ nos, highlightIds, buscando = false }) {
  if (!nos?.length) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
        {buscando
          ? "Nenhuma área corresponde à busca."
          : "Nenhuma área cadastrada."}
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-[radial-gradient(circle_at_1px_1px,rgb(228_228_231)_1px,transparent_0)] [background-size:18px_18px] p-3 sm:p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {nos.map((no) => (
          <QuadroRaizView
            key={no.id}
            no={no}
            highlightIds={highlightIds}
            buscando={buscando}
          />
        ))}
      </div>
    </div>
  );
}

function RamoEdit({ filho, tema, onChange, onRemove }) {
  return (
    <li
      className={[
        "flex min-w-[9rem] max-w-full flex-1 items-center gap-1.5 rounded-lg border px-2 py-1.5",
        filho.ativo ? tema.ramoAtivo : "border-zinc-200 bg-white",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={Boolean(filho.ativo)}
        onChange={(e) => onChange(filho.id, { ativo: e.target.checked })}
        className="h-3.5 w-3.5 shrink-0 rounded border-zinc-300 text-emerald-600"
        aria-label={`Ativo: ${filho.nome}`}
      />
      <input
        type="text"
        value={filho.nome}
        onChange={(e) => onChange(filho.id, { nome: e.target.value })}
        className="min-w-0 flex-1 bg-transparent text-xs font-medium text-zinc-800 outline-none"
      />
      <button
        type="button"
        onClick={() => onRemove(filho.id)}
        className="shrink-0 text-[10px] text-red-500 hover:text-red-700"
      >
        ×
      </button>
    </li>
  );
}

function QuadroRaizEdit({ no, onChange, onAddFilho, onRemove }) {
  const tema = temaRaiz(no.id);
  const filhos = no.filhos ?? [];

  return (
    <article
      id={`busca-no-${no.id}`}
      className={[
        "flex min-h-[12rem] flex-col overflow-hidden rounded-2xl border-2 shadow-sm",
        tema.borda,
        tema.fundo,
      ].join(" ")}
    >
      <header className={`flex flex-wrap items-center gap-2 px-3 py-2.5 ${tema.cabecalho}`}>
        <input
          type="checkbox"
          checked={Boolean(no.ativo)}
          onChange={(e) => onChange(no.id, { ativo: e.target.checked })}
          className="h-3.5 w-3.5 rounded border-zinc-300 text-emerald-600"
          aria-label={`Área ativa: ${no.nome}`}
        />
        <input
          type="text"
          value={no.nome}
          onChange={(e) => onChange(no.id, { nome: e.target.value })}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
        />
        <button
          type="button"
          onClick={() => onAddFilho(no.id)}
          className="rounded-md bg-white/60 px-2 py-0.5 text-[10px] font-medium hover:bg-white"
        >
          + ramo
        </button>
        {!filhos.length ? (
          <button
            type="button"
            onClick={() => onRemove(no.id)}
            className="rounded-md px-2 py-0.5 text-[10px] font-medium text-red-700 hover:bg-red-50"
          >
            remover área
          </button>
        ) : null}
      </header>

      <div className="relative flex flex-1 flex-col px-3 pb-3 pt-1">
        {filhos.length ? (
          <>
            <div className={`mx-auto h-3 w-px ${tema.tronco}`} />
            <div className={`mx-4 mb-2 h-px ${tema.tronco}`} />
            <ul className="flex flex-wrap justify-center gap-2" role="list">
              {filhos.map((filho) => (
                <RamoEdit
                  key={filho.id}
                  filho={filho}
                  tema={tema}
                  onChange={onChange}
                  onRemove={onRemove}
                />
              ))}
            </ul>
          </>
        ) : (
          <p className="m-auto text-xs text-zinc-400">Adicione ramos específicos</p>
        )}
      </div>
    </article>
  );
}

export function BuscaArvoreEdit({ nos, onChange, onAddFilho, onRemove, onAddRaiz }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-zinc-200 bg-[radial-gradient(circle_at_1px_1px,rgb(228_228_231)_1px,transparent_0)] [background-size:18px_18px] p-3 sm:p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {nos.map((no) => (
            <QuadroRaizEdit
              key={no.id}
              no={no}
              onChange={onChange}
              onAddFilho={onAddFilho}
              onRemove={onRemove}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onAddRaiz}
        className="w-full rounded-xl border-2 border-dashed border-zinc-300 bg-white px-3 py-2.5 text-xs font-medium text-zinc-600 hover:border-emerald-400 hover:text-emerald-700"
      >
        + nova área principal (ex.: Marketing, Dados…)
      </button>
    </div>
  );
}
