"use client";

import { useMemo } from "react";
import { ABAS_SOLIDES_VAGAS } from "@/lib/solidesVagasEstrutura";

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

function MoldeCampos() {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-3">
      {ABAS_SOLIDES_VAGAS.map((aba) => (
        <section key={aba.id}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-800">
            {aba.titulo}
          </h3>
          <ul className="mt-1.5 space-y-1 border-l-2 border-violet-100 pl-3">
            {aba.campos.map((campo) => (
              <li key={campo.id} className="text-sm text-zinc-700">
                <span className="font-medium text-zinc-900">{campo.label}</span>
                {campo.obrigatorio ? <span className="text-rose-600"> *</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function SolidesPacoteViewer({
  preview = "",
  loading = false,
  onGerar,
  gerando = false,
  desatualizado = false,
  segmentacaoId = null,
}) {
  const sections = useMemo(() => {
    if (!preview?.trim()) return [];
    return parsePreviewSections(preview);
  }, [preview]);

  const formUrl =
    preview?.trim() && segmentacaoId
      ? `/api/curriculo/segmentacoes/${segmentacaoId}/solides/form`
      : null;

  if (loading) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-zinc-500">
        Carregando…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[280px] flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-violet-100 px-3 py-2">
        <div className="flex items-center gap-2">
          {formUrl ? (
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-violet-700 hover:underline"
            >
              Abrir formulário
            </a>
          ) : (
            <span className="text-xs text-zinc-500">Campos do portal</span>
          )}
          {desatualizado ? (
            <span className="text-[10px] font-medium text-amber-700">Desatualizado</span>
          ) : null}
        </div>
        {onGerar ? (
          <button
            type="button"
            onClick={onGerar}
            disabled={gerando}
            className="rounded-lg border border-violet-200 bg-white px-2.5 py-1 text-xs font-medium text-violet-800 hover:bg-violet-50 disabled:opacity-50"
          >
            {gerando ? "Gerando…" : preview?.trim() ? "Regenerar" : "Gerar"}
          </button>
        ) : null}
      </div>

      {preview?.trim() ? (
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {sections.map((sec) => (
            <Secao key={sec.title} title={sec.title} body={sec.body} />
          ))}
        </div>
      ) : (
        <MoldeCampos />
      )}
    </div>
  );
}
