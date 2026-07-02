"use client";

import { useState } from "react";
import CvTextThumbnail from "@/components/curriculo/CvTextThumbnail";
import { getThumbSize } from "@/components/curriculo/CvPdfThumbnail";
import { formatDateTime } from "@/lib/format";

const ORIGEM = {
  manual: { label: "Manual", badge: "bg-zinc-100 text-zinc-700", bar: "border-l-zinc-300" },
  vaga: { label: "Vaga", badge: "bg-emerald-100 text-emerald-800", bar: "border-l-emerald-400" },
  busca: { label: "Segmentos", badge: "bg-indigo-100 text-indigo-800", bar: "border-l-indigo-400" },
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

function PdfThumb({ compact }) {
  const { width, height } = getThumbSize(compact);

  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center rounded-md border border-red-100 bg-gradient-to-br from-red-50 to-white ring-1 ring-red-100/80"
      style={{ width, height }}
    >
      <span className="text-[10px] font-bold uppercase tracking-wide text-red-700">PDF</span>
    </div>
  );
}

export default function CvSegmentacaoCard({ segmentacao, initialSections = null, compact = false }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState(initialSections);
  const origem = metaOrigem(segmentacao.origem);

  const previewText = initialSections?.length
    ? initialSections.map((s) => s.body).join("\n").slice(0, 800)
    : null;

  const pdfUrl = segmentacao.hasPdf
    ? `/api/curriculo/segmentacoes/${segmentacao.id}/arquivo`
    : null;

  async function carregarConteudo() {
    if (sections?.length || segmentacao.hasPdf) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/curriculo/segmentacoes/${segmentacao.id}/conteudo`);
      if (!res.ok) return;
      const data = await res.json();
      setSections(data.sections ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) await carregarConteudo();
  }

  return (
    <article
      className={[
        "overflow-hidden rounded-xl border border-zinc-200/90 border-l-[3px] bg-white transition",
        compact ? "shadow-none hover:bg-zinc-50/80" : "shadow-sm hover:shadow-md",
        origem.bar,
      ].join(" ")}
    >
      <div className={`flex items-center gap-2.5 ${compact ? "p-2" : "flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5"}`}>
        <div className="shrink-0">
          {segmentacao.hasPdf ? (
            <PdfThumb compact={compact} />
          ) : (
            <CvTextThumbnail text={previewText ?? "…"} compact={compact} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${origem.badge}`}
            >
              {origem.label}
            </span>
            <span className="text-[10px] text-zinc-400">
              {formatDateTime(segmentacao.updatedAt ?? segmentacao.criado_em)}
            </span>
          </div>

          <h3
            className={`font-semibold leading-snug text-zinc-900 ${compact ? "mt-0.5 line-clamp-1 text-sm" : "mt-2 text-base sm:text-lg"}`}
          >
            {segmentacao.vaga_titulo}
          </h3>

          {!compact && segmentacao.vaga_descricao ? (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">
              {segmentacao.vaga_descricao}
            </p>
          ) : null}

          <div className={`flex flex-wrap gap-1.5 ${compact ? "mt-1" : "mt-4"}`}>
            <button
              type="button"
              onClick={toggleOpen}
              className="rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-medium text-white hover:bg-zinc-800"
            >
              {loading ? "…" : open ? "Ocultar" : "Ver"}
            </button>
            {pdfUrl ? (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50"
              >
                PDF
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {open ? (
        <div className={`space-y-1.5 border-t border-zinc-100 bg-zinc-50/80 ${compact ? "p-2" : "p-4 sm:px-5"}`}>
          {sections?.length ? (
            sections.map((sec) => <CvSection key={sec.title} title={sec.title} body={sec.body} />)
          ) : segmentacao.hasPdf ? (
            <p className="text-xs text-zinc-600">PDF — use o botão acima.</p>
          ) : (
            <p className="text-xs text-zinc-500">Sem conteúdo.</p>
          )}
        </div>
      ) : null}
    </article>
  );
}
