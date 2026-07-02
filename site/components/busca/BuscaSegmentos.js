"use client";

import { useEffect, useState } from "react";
import { cargoEhComplemento } from "@/lib/alvosSegmento";

const CORES_AREA = {
  "dados-bi-analytics": {
    fundo: "bg-emerald-50/50",
    cabecalho: "bg-emerald-100/80 text-emerald-950",
    cvAtivo: "border-emerald-500 ring-1 ring-emerald-400",
    inativo: "border-emerald-200/80",
    nicho: "text-emerald-900/70",
    chipAtivo: "border-emerald-500 bg-emerald-100 text-emerald-900 ring-1 ring-emerald-400",
    chipInativo: "border-emerald-200/80 bg-white text-zinc-600 hover:border-emerald-300",
    chipComplemento:
      "border-dashed border-amber-400 bg-amber-50/80 text-amber-950 ring-1 ring-amber-300/80",
    chipDestaque: "ring-2 ring-amber-400 ring-offset-1",
  },
  desenvolvimento: {
    fundo: "bg-sky-50/40",
    cabecalho: "bg-sky-100/80 text-sky-950",
    cvAtivo: "border-sky-500 ring-1 ring-sky-400",
    inativo: "border-sky-200/80",
    nicho: "text-sky-900/70",
    chipAtivo: "border-sky-500 bg-sky-100 text-sky-900 ring-1 ring-sky-400",
    chipInativo: "border-sky-200/80 bg-white text-zinc-600 hover:border-sky-300",
    chipComplemento:
      "border-dashed border-amber-400 bg-amber-50/80 text-amber-950 ring-1 ring-amber-300/80",
    chipDestaque: "ring-2 ring-amber-400 ring-offset-1",
  },
  "engenharia-software": {
    fundo: "bg-indigo-50/40",
    cabecalho: "bg-indigo-100/80 text-indigo-950",
    cvAtivo: "border-indigo-500 ring-1 ring-indigo-400",
    inativo: "border-indigo-200/80",
    nicho: "text-indigo-900/70",
    chipAtivo: "border-indigo-500 bg-indigo-100 text-indigo-900 ring-1 ring-indigo-400",
    chipInativo: "border-indigo-200/80 bg-white text-zinc-600 hover:border-indigo-300",
    chipComplemento:
      "border-dashed border-amber-400 bg-amber-50/80 text-amber-950 ring-1 ring-amber-300/80",
    chipDestaque: "ring-2 ring-amber-400 ring-offset-1",
  },
  "ia-ml": {
    fundo: "bg-violet-50/40",
    cabecalho: "bg-violet-100/80 text-violet-950",
    cvAtivo: "border-violet-500 ring-1 ring-violet-400",
    inativo: "border-violet-200/80",
    nicho: "text-violet-900/70",
    chipAtivo: "border-violet-500 bg-violet-100 text-violet-900 ring-1 ring-violet-400",
    chipInativo: "border-violet-200/80 bg-white text-zinc-600 hover:border-violet-300",
    chipComplemento:
      "border-dashed border-amber-400 bg-amber-50/80 text-amber-950 ring-1 ring-amber-300/80",
    chipDestaque: "ring-2 ring-amber-400 ring-offset-1",
  },
};

const COR_PADRAO = {
  fundo: "bg-zinc-50/50",
  cabecalho: "bg-zinc-100 text-zinc-900",
  cvAtivo: "border-emerald-500 ring-1 ring-emerald-400",
  inativo: "border-zinc-200",
  nicho: "text-zinc-600",
  chipAtivo: "border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-400",
  chipInativo: "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
  chipComplemento:
    "border-dashed border-amber-400 bg-amber-50/80 text-amber-950 ring-1 ring-amber-300/80",
  chipDestaque: "ring-2 ring-amber-400 ring-offset-1",
};

function temaArea(slug) {
  return CORES_AREA[slug] ?? COR_PADRAO;
}

function contarSelecionados(area, chavesAtivas) {
  return (area.nichos ?? []).reduce(
    (acc, n) => acc + (n.titulos ?? []).filter((t) => chavesAtivas.has(t.chave)).length,
    0,
  );
}

function expandidosIniciais(catalogo, segmentosCv, chavesAtivas) {
  const set = new Set();
  for (const area of catalogo ?? []) {
    if (segmentosCv.has(area.slug) || contarSelecionados(area, chavesAtivas) > 0) {
      set.add(area.slug);
    }
  }
  return set;
}

function TituloChip({ titulo, ativo, complemento, destacado, tema, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(titulo.chave)}
      aria-pressed={ativo}
      title={complemento ? "Entra como complemento nos CVs marcados" : undefined}
      className={[
        "rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition",
        ativo ? (complemento ? tema.chipComplemento : tema.chipAtivo) : tema.chipInativo,
        destacado ? tema.chipDestaque : "",
      ].join(" ")}
    >
      {titulo.titulo}
    </button>
  );
}

export default function BuscaSegmentos({
  catalogo,
  segmentosAtivos,
  titulosAtivos,
  onToggleSegmento,
  onToggleTitulo,
  buscando = false,
  highlightChaves,
  abrirSegmento = null,
}) {
  const chavesAtivas = new Set(titulosAtivos ?? []);
  const segmentosCv = new Set(segmentosAtivos ?? []);

  const [expandidos, setExpandidos] = useState(() =>
    expandidosIniciais(catalogo, segmentosCv, chavesAtivas),
  );

  useEffect(() => {
    if (!abrirSegmento) return;
    setExpandidos((prev) => new Set(prev).add(abrirSegmento));
  }, [abrirSegmento]);

  useEffect(() => {
    if (!buscando) return;
    setExpandidos((prev) => {
      const next = new Set(prev);
      for (const area of catalogo ?? []) {
        const temMatch = (area.nichos ?? []).some((n) =>
          (n.titulos ?? []).some((t) => highlightChaves?.has(t.chave)),
        );
        if (temMatch) next.add(area.slug);
      }
      return next;
    });
  }, [buscando, highlightChaves, catalogo]);

  function toggleExpandido(slug) {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function abrirTodos() {
    setExpandidos(new Set((catalogo ?? []).map((a) => a.slug)));
  }

  function fecharTodos() {
    setExpandidos(new Set());
  }

  if (!catalogo?.length) {
    return null;
  }

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Segmentos</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Checkbox gera CV do segmento. Cargos de outras áreas entram como complemento.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={abrirTodos}
            className="rounded-md px-2 py-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          >
            Abrir todos
          </button>
          <button
            type="button"
            onClick={fecharTodos}
            className="rounded-md px-2 py-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          >
            Fechar todos
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {catalogo.map((area) => {
          const tema = temaArea(area.slug);
          const geraCv = segmentosCv.has(area.slug);
          const aberto = expandidos.has(area.slug);
          const selecionados = contarSelecionados(area, chavesAtivas);
          const temMatch =
            buscando &&
            (area.nichos ?? []).some((n) =>
              (n.titulos ?? []).some((t) => highlightChaves?.has(t.chave)),
            );

          if (buscando && !temMatch && !selecionados) {
            return null;
          }

          const nichosVisiveis = (area.nichos ?? [])
            .map((nicho) => {
              const titulos = (nicho.titulos ?? []).filter(
                (t) => !buscando || highlightChaves?.has(t.chave),
              );
              return titulos.length ? { ...nicho, titulos } : null;
            })
            .filter(Boolean);

          return (
            <article
              key={area.slug}
              id={`busca-area-${area.slug}`}
              className={[
                "rounded-2xl border-2 transition",
                tema.fundo,
                geraCv ? tema.cvAtivo : tema.inativo,
              ].join(" ")}
            >
              <div className="flex items-start gap-2 p-4">
                <input
                  type="checkbox"
                  checked={geraCv}
                  onChange={() => onToggleSegmento(area.slug)}
                  aria-label={`Gerar currículo: ${area.nome}`}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  aria-expanded={aberto}
                  onClick={() => toggleExpandido(area.slug)}
                  className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
                >
                  <span className={`rounded-lg px-2 py-1 text-sm font-semibold ${tema.cabecalho}`}>
                    {area.nome}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {geraCv ? "Currículo ativo" : "Sem currículo"}
                    {selecionados > 0 ? ` · ${selecionados} cargo(s) aqui` : ""}
                  </span>
                </button>
              </div>

              {aberto && nichosVisiveis.length ? (
                <div className="space-y-4 border-t border-white/60 px-4 pb-4 pt-1">
                  {nichosVisiveis.map((nicho) => (
                    <div key={nicho.id}>
                      <p
                        className={`mb-2 text-[10px] font-semibold uppercase tracking-wide ${tema.nicho}`}
                      >
                        {nicho.nome}
                      </p>
                      <ul className="flex flex-wrap gap-2" role="list">
                        {nicho.titulos.map((titulo) => {
                          const ativo = chavesAtivas.has(titulo.chave);
                          const complemento =
                            ativo && cargoEhComplemento(titulo.chave, segmentosAtivos);

                          return (
                            <li key={titulo.chave}>
                              <TituloChip
                                titulo={titulo}
                                ativo={ativo}
                                complemento={complemento}
                                destacado={buscando && highlightChaves?.has(titulo.chave)}
                                tema={tema}
                                onToggle={onToggleTitulo}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function segmentosFromTitulos(titulosAtivos) {
  return [...new Set((titulosAtivos ?? []).map((chave) => chave.split("/")[0]).filter(Boolean))];
}
