"use client";

import { useState } from "react";
import CvTextThumbnail from "@/components/curriculo/CvTextThumbnail";
import { formatDateTime } from "@/lib/format";
import { labelSegmento, resumoAlvos, temaSegmento } from "@/lib/cvSegmentoTema";

const ORIGEM = {
  manual: { label: "Arquivo", dot: "bg-zinc-400" },
  vaga: { label: "Vaga", dot: "bg-emerald-500" },
  busca: { label: "Segmento", dot: "bg-indigo-500" },
  segmento: { label: "Segmento", dot: "bg-indigo-500" },
};

function metaOrigem(origem) {
  return ORIGEM[origem] ?? ORIGEM.busca;
}

function CvSection({ title, body }) {
  return (
    <details className="overflow-hidden rounded-lg border border-zinc-200/80 bg-white">
      <summary className="cursor-pointer list-none px-3 py-2 marker:content-none [&::-webkit-details-marker]:hidden">
        <p className="text-xs font-medium text-zinc-800">{title}</p>
      </summary>
      <div className="border-t border-zinc-100 px-3 py-2">
        <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-700">
          {body}
        </pre>
      </div>
    </details>
  );
}

function PdfMini() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded border border-red-100 bg-red-50/80">
      <span className="text-[10px] font-bold uppercase text-red-600">PDF</span>
    </div>
  );
}

export default function CvSegmentacaoCard({
  segmentacao,
  initialSections = null,
  variant = "audience",
  aberto = false,
  onAbrirPreview,
  onDelete,
  deleting = false,
}) {
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState(initialSections);
  const origem = metaOrigem(segmentacao.origem);
  const tema = temaSegmento(segmentacao.segmento_slug);
  const segmentLabel =
    segmentacao.origem === "busca" || segmentacao.origem === "segmento"
      ? labelSegmento(segmentacao)
      : segmentacao.vaga_titulo;
  const subtitle =
    segmentacao.origem === "busca" || segmentacao.origem === "segmento"
      ? resumoAlvos(segmentacao)
      : origem.label;

  const previewText = initialSections?.length
    ? initialSections.map((s) => s.body).join("\n").slice(0, 500)
    : null;

  const pdfUrl = segmentacao.hasPdf
    ? `/api/curriculo/segmentacoes/${segmentacao.id}/arquivo`
    : null;

  async function carregarConteudo() {
    if (sections?.length || segmentacao.hasPdf) return sections;
    setLoading(true);
    try {
      const res = await fetch(`/api/curriculo/segmentacoes/${segmentacao.id}/conteudo`);
      if (!res.ok) return null;
      const data = await res.json();
      const next = data.sections ?? [];
      setSections(next);
      return next;
    } finally {
      setLoading(false);
    }
  }

  async function handleAbrirPreview(event) {
    event.stopPropagation();
    onAbrirPreview?.(segmentacao, sections ?? initialSections);
    if (!sections?.length && !initialSections?.length && !segmentacao.hasPdf) {
      await carregarConteudo();
    }
  }

  if (variant === "panel") {
    return (
      <div className="space-y-2">
        {sections?.length ? (
          sections.map((sec) => <CvSection key={sec.title} title={sec.title} body={sec.body} />)
        ) : segmentacao.hasPdf ? (
          <p className="text-sm text-zinc-600">
            Versão em PDF —{" "}
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:underline"
            >
              abrir arquivo
            </a>
          </p>
        ) : loading ? (
          <p className="text-sm text-zinc-500">Carregando…</p>
        ) : (
          <p className="text-sm text-zinc-500">Sem conteúdo disponível.</p>
        )}
      </div>
    );
  }

  const displayPreview =
    previewText ??
    (sections?.length ? sections.map((s) => s.body).join("\n").slice(0, 500) : null);

  return (
    <article
      className={[
        "group relative flex w-[168px] shrink-0 flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition",
        aberto
          ? "border-emerald-400 ring-2 ring-emerald-400/40"
          : "border-zinc-200/90 hover:border-zinc-300 hover:shadow-md",
      ].join(" ")}
    >
      <div className={`h-1 shrink-0 ${tema.header}`} aria-hidden />

      <div className="flex flex-1 flex-col p-2">
        <button
          type="button"
          onClick={handleAbrirPreview}
          className="group/thumb mx-auto overflow-hidden rounded-md border border-zinc-100 bg-zinc-50 transition hover:border-emerald-300 hover:ring-2 hover:ring-emerald-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label={`Abrir ${segmentLabel}`}
          title="Abrir documento"
        >
          <div className="h-[96px] w-[104px]">
            {segmentacao.hasPdf ? (
              <PdfMini />
            ) : (
              <CvTextThumbnail text={displayPreview ?? "…"} variant="audienceCard" />
            )}
          </div>
        </button>

        <div className="mt-2 min-h-0 flex-1">
          <p
            className="line-clamp-2 text-xs font-semibold leading-snug text-zinc-900"
            title={segmentLabel}
          >
            {segmentLabel}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-600" title={subtitle}>
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-zinc-100 px-2 py-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`h-2 w-2 shrink-0 rounded-full ${origem.dot}`} title={origem.label} />
          {pdfUrl ? (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="truncate text-[11px] font-medium text-zinc-500 hover:text-zinc-800"
            >
              PDF
            </a>
          ) : (
            <span className="truncate text-[11px] text-zinc-400">
              {formatDateTime(segmentacao.updatedAt ?? segmentacao.criado_em).split(" ")[0]}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(segmentacao.id);
          }}
          disabled={deleting || segmentacao.slot}
          className="shrink-0 rounded p-0.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
          aria-label={`Excluir ${segmentLabel}`}
          title={
            segmentacao.slot
              ? "Variação fixa — desmarque em Segmentos para ocultar"
              : "Excluir"
          }
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c-.784 0-1.438.364-1.865.998H10v1.003H8.135A2.001 2.001 0 0010 6.001V4z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </article>
  );
}
