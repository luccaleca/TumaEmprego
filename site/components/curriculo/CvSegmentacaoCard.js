"use client";

import { useState } from "react";
import CvTextThumbnail from "@/components/curriculo/CvTextThumbnail";
import { THUMB_WIDTH } from "@/components/curriculo/CvPdfThumbnail";
import { formatDateTime } from "@/lib/format";

const THUMB_HEIGHT = Math.round(THUMB_WIDTH * 1.414);

function CvSection({ title, body }) {
  return (
    <details className="group overflow-hidden rounded-lg border border-zinc-200/90 bg-white">
      <summary className="cursor-pointer list-none px-3 py-2 marker:content-none [&::-webkit-details-marker]:hidden">
        <p className="text-sm font-medium text-zinc-800">{title}</p>
      </summary>
      <div className="border-t border-zinc-200/80 px-3 py-2">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-700">
          {body}
        </pre>
      </div>
    </details>
  );
}

function PdfThumb() {
  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center rounded-md border border-zinc-200 bg-red-50 shadow-sm"
      style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT }}
    >
      <span className="text-sm font-bold text-red-800">PDF</span>
    </div>
  );
}

export default function CvSegmentacaoCard({ segmentacao, initialSections = null }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState(initialSections);

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
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
        <div className="shrink-0">
          {segmentacao.hasPdf ? (
            <PdfThumb />
          ) : (
            <CvTextThumbnail text={previewText ?? "…"} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
            Vaga
          </p>
          <h3 className="mt-1 text-lg font-bold leading-snug text-zinc-900">
            {segmentacao.vaga_titulo}
          </h3>

          {segmentacao.vaga_descricao ? (
            <pre className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-600">
              {segmentacao.vaga_descricao}
            </pre>
          ) : null}

          <p className="mt-2 text-[11px] text-zinc-400">
            {segmentacao.origem === "manual" ? "Manual" : "Segmentos"} ·{" "}
            {formatDateTime(segmentacao.updatedAt ?? segmentacao.criado_em)}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggleOpen}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {loading ? "Carregando…" : open ? "Ocultar" : "Ver currículo"}
            </button>
            {pdfUrl ? (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
              >
                Abrir PDF
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {open ? (
        <div className="space-y-2 border-t border-zinc-100 bg-zinc-50/50 p-4">
          {sections?.length ? (
            sections.map((sec) => (
              <CvSection key={sec.title} title={sec.title} body={sec.body} />
            ))
          ) : segmentacao.hasPdf ? (
            <p className="text-sm text-zinc-600">PDF — use Abrir PDF acima.</p>
          ) : (
            <p className="text-sm text-zinc-500">Sem conteúdo.</p>
          )}
        </div>
      ) : null}
    </article>
  );
}
