"use client";

import { useMemo } from "react";

function parsePreviewSections(raw) {
  const cleaned = String(raw ?? "").trim();
  const parts = cleaned.split(/^## /m);
  const sections = [];

  for (const part of parts.slice(1)) {
    const nl = part.indexOf("\n");
    sections.push({
      title: part.slice(0, nl).trim(),
      body: part.slice(nl + 1).trim(),
    });
  }

  return sections;
}

function Secao({ title, body }) {
  return (
    <details className="overflow-hidden rounded-lg border border-violet-200/70 bg-violet-50/30" open>
      <summary className="cursor-pointer list-none px-3 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
        <p className="text-sm font-medium text-violet-950">{title}</p>
      </summary>
      <div className="border-t border-violet-100 px-3 py-2.5">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-700">
          {body}
        </pre>
      </div>
    </details>
  );
}

export default function SolidesPacoteViewer({
  preview = "",
  loading = false,
  onGerar,
  gerando = false,
  desatualizado = false,
}) {
  const sections = useMemo(() => {
    if (!preview?.trim()) return [];
    return parsePreviewSections(preview);
  }, [preview]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-zinc-500">
        Carregando pacote Sólides…
      </div>
    );
  }

  if (!preview?.trim()) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-zinc-600">Pacote Sólides ainda não gerado para esta vaga.</p>
        {onGerar ? (
          <button
            type="button"
            onClick={onGerar}
            disabled={gerando}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {gerando ? "Gerando…" : "Gerar pacote Sólides"}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3">
      {desatualizado ? (
        <p className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
          O CV ATS foi editado depois do pacote Sólides — regenere para alinhar os campos.
        </p>
      ) : null}
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-violet-600">
        Formato Sólides Profiler
      </p>
      <div className="space-y-2">
        {sections.map((sec) => (
          <Secao key={sec.title} title={sec.title} body={sec.body} />
        ))}
      </div>
      {onGerar ? (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onGerar}
            disabled={gerando}
            className="rounded-lg border border-violet-200 bg-white px-2.5 py-1 text-xs font-medium text-violet-800 hover:bg-violet-50 disabled:opacity-50"
          >
            {gerando ? "Gerando…" : "Regenerar Sólides"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
