"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/format";
import { labelPortal } from "@/lib/portalLabels";
import { labelCvVaga, labelSegmento, resumoAlvos, temaSegmento } from "@/lib/cvSegmentoTema";

const ORIGEM = {
  manual: { label: "Arquivo", dot: "bg-zinc-400" },
  vaga: { label: "Vaga", dot: "bg-emerald-500" },
  busca: { label: "Segmento", dot: "bg-indigo-500" },
  segmento: { label: "Segmento", dot: "bg-indigo-500" },
};

function metaOrigem(origem) {
  return ORIGEM[origem] ?? ORIGEM.busca;
}

export default function CvSegmentacaoCard({
  segmentacao,
  initialSections = null,
  aberto = false,
  onAbrirPreview,
  onDelete,
  deleting = false,
}) {
  const [sections, setSections] = useState(initialSections);
  const origem = metaOrigem(segmentacao.origem);
  const tema = temaSegmento(segmentacao.segmento_slug);
  const portalLabel = labelPortal(segmentacao.portal);
  const ehSlot = Boolean(segmentacao.slot);
  const segmentLabel =
    segmentacao.label_cv ||
    (segmentacao.origem === "busca" || segmentacao.origem === "segmento"
      ? labelSegmento(segmentacao)
      : labelCvVaga(segmentacao));
  const subtitle =
    segmentacao.origem === "vaga"
      ? [
          "Vaga",
          portalLabel,
          labelSegmento(segmentacao) !== segmentLabel ? labelSegmento(segmentacao) : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : segmentacao.origem === "busca" || segmentacao.origem === "segmento"
        ? resumoAlvos(segmentacao)
        : origem.label;

  async function carregarConteudo() {
    if (sections?.length || segmentacao.hasPdf) return sections;
    const res = await fetch(`/api/curriculo/segmentacoes/${segmentacao.id}/conteudo`);
    if (!res.ok) return null;
    const data = await res.json();
    const next = data.sections ?? [];
    setSections(next);
    return next;
  }

  async function handleAbrirPreview(event) {
    event.stopPropagation();
    onAbrirPreview?.(segmentacao, sections ?? initialSections);
    if (!sections?.length && !initialSections?.length && !segmentacao.hasPdf) {
      await carregarConteudo();
    }
  }

  const pdfUrl = segmentacao.hasPdf
    ? `/api/curriculo/segmentacoes/${segmentacao.id}/arquivo`
    : null;

  const dataCurta = formatDateTime(segmentacao.updatedAt ?? segmentacao.criado_em).split(" ")[0];

  return (
    <article
      className={[
        "group relative overflow-hidden transition",
        ehSlot
          ? [
              tema.card,
              "rounded-lg !border-2 !border-zinc-600 shadow-md",
              aberto
                ? "!border-emerald-500 ring-2 ring-emerald-400/45"
                : "ring-1 ring-black/5",
            ].join(" ")
          : [
              "rounded-md border",
              aberto
                ? "border-emerald-400 bg-white ring-1 ring-emerald-400/40"
                : "border-zinc-200/90 bg-white hover:border-zinc-300",
            ].join(" "),
      ].join(" ")}
    >
      <div
        className={["w-full", ehSlot ? `h-1.5 ${tema.header}` : `h-0.5 ${tema.header}`].join(" ")}
        aria-hidden
      />

      <button
        type="button"
        onClick={handleAbrirPreview}
        className={[
          "w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500",
          ehSlot ? "px-2.5 py-2.5" : "px-1.5 py-1.5",
        ].join(" ")}
        aria-label={`Abrir ${segmentLabel}`}
        title={segmentLabel}
      >
        <div className="flex items-center gap-1">
          {ehSlot ? (
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white ${tema.header}`}
            >
              Base
            </span>
          ) : null}
          {!ehSlot && segmentacao.origem === "vaga" ? (
            <span className="rounded bg-emerald-100 px-0.5 text-[7px] font-bold uppercase tracking-wide text-emerald-900">
              Vaga
            </span>
          ) : null}
          {portalLabel && !ehSlot ? (
            <span
              className={[
                "truncate rounded px-0.5 text-[7px] font-semibold uppercase tracking-wide",
                segmentacao.portal === "solides"
                  ? "bg-violet-100 text-violet-800"
                  : "bg-sky-100 text-sky-800",
              ].join(" ")}
            >
              {portalLabel}
            </span>
          ) : null}
        </div>
        <p
          className={[
            "truncate font-semibold leading-tight text-zinc-900",
            ehSlot ? "mt-1 text-xs" : "mt-0.5 text-[10px]",
          ].join(" ")}
        >
          {ehSlot ? labelSegmento(segmentacao) : segmentLabel}
        </p>
        <p
          className={[
            "mt-0.5 truncate leading-tight text-zinc-500",
            ehSlot ? "text-[10px] font-medium text-zinc-600" : "text-[9px]",
          ].join(" ")}
          title={ehSlot ? "CV geral do segmento" : subtitle}
        >
          {ehSlot ? "CV geral do segmento" : subtitle}
        </p>
      </button>

      <div
        className={[
          "flex items-center justify-between gap-0.5 px-1 py-0.5",
          ehSlot ? "border-t border-zinc-200/80 bg-white/60" : "border-t border-zinc-100",
        ].join(" ")}
      >
        {pdfUrl ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.open(pdfUrl, "_blank", "noopener,noreferrer");
            }}
            className="text-[8px] font-medium text-zinc-400 hover:text-zinc-700"
          >
            PDF
          </button>
        ) : (
          <span className="flex min-w-0 items-center gap-0.5 text-[8px] text-zinc-400">
            <span className={`h-1 w-1 shrink-0 rounded-full ${origem.dot}`} title={origem.label} />
            <span className="truncate">{dataCurta}</span>
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (deleting || ehSlot) return;
            onDelete?.(segmentacao.id);
          }}
          disabled={deleting || ehSlot}
          className="shrink-0 rounded p-0.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
          aria-label={`Excluir ${segmentLabel}`}
          title={ehSlot ? "Fixo" : "Excluir"}
        >
          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
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
