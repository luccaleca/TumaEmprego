"use client";

import { CvEstruturaLista } from "@/components/curriculo/CvEstruturaSecoes";

function extrairNome(preamble) {
  const linha = String(preamble ?? "")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith("# "));
  return linha ? linha.replace(/^#\s+/, "") : "Seu nome";
}

export default function CvEstruturaBaseCard({ preamble = "", sections = [], onAbrir }) {
  const nome = extrairNome(preamble);

  return (
    <article className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-lg ring-1 ring-zinc-200/50">
      <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-600" aria-hidden />

      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2.5">
        <div className="min-w-0">
          <span className="inline-flex rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-800">
            ATS
          </span>
          <h2 className="mt-1 text-sm font-semibold text-zinc-900">Estrutura base</h2>
        </div>
        <p className="max-w-[100px] truncate text-[10px] font-medium text-zinc-500" title={nome}>
          {nome}
        </p>
      </div>

      <div className="px-3 py-2.5">
        <p className="mb-2 text-[10px] text-zinc-400">Clique em uma seção para ver o formato</p>
        <CvEstruturaLista preamble={preamble} sections={sections} compact />
      </div>

      <div className="border-t border-zinc-100 px-3 py-2">
        <button
          type="button"
          onClick={onAbrir}
          className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          Abrir estrutura completa
        </button>
      </div>
    </article>
  );
}
