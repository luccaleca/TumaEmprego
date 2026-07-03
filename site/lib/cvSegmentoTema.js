import { LABELS_SEGMENTO } from "@/lib/conteudoConstants";

export const TEMA_SEGMENTO = {
  "dados-bi-analytics": {
    card: "border-emerald-200/90 bg-gradient-to-b from-emerald-50/70 via-white to-white",
    header: "bg-emerald-600",
    badge: "bg-emerald-100 text-emerald-900",
    ring: "ring-emerald-100",
  },
  desenvolvimento: {
    card: "border-sky-200/90 bg-gradient-to-b from-sky-50/60 via-white to-white",
    header: "bg-sky-600",
    badge: "bg-sky-100 text-sky-900",
    ring: "ring-sky-100",
  },
  "engenharia-software": {
    card: "border-indigo-200/90 bg-gradient-to-b from-indigo-50/60 via-white to-white",
    header: "bg-indigo-600",
    badge: "bg-indigo-100 text-indigo-900",
    ring: "ring-indigo-100",
  },
  "marketing-growth": {
    card: "border-orange-200/90 bg-gradient-to-b from-orange-50/60 via-white to-white",
    header: "bg-orange-600",
    badge: "bg-orange-100 text-orange-900",
    ring: "ring-orange-100",
  },
  "ia-ml": {
    card: "border-violet-200/90 bg-gradient-to-b from-violet-50/60 via-white to-white",
    header: "bg-violet-600",
    badge: "bg-violet-100 text-violet-900",
    ring: "ring-violet-100",
  },
};

const TEMA_PADRAO = {
  card: "border-zinc-200/90 bg-gradient-to-b from-zinc-50/80 via-white to-white",
  header: "bg-zinc-700",
  badge: "bg-zinc-100 text-zinc-800",
  ring: "ring-zinc-100",
};

export function temaSegmento(slug) {
  return TEMA_SEGMENTO[slug] ?? TEMA_PADRAO;
}

export function labelSegmento(segmentacao) {
  if (segmentacao?.segmento_slug) {
    return LABELS_SEGMENTO[segmentacao.segmento_slug] ?? segmentacao.segmento_slug;
  }

  const titulo = segmentacao?.vaga_titulo ?? "";
  if (titulo.startsWith("Currículo · ")) {
    return titulo.replace("Currículo · ", "");
  }

  return titulo || "Segmento";
}

export function resumoAlvos(segmentacao) {
  const alvos = segmentacao?.alvos ?? [];
  if (!alvos.length) return "CV geral do segmento";
  if (alvos.length === 1) {
    return `${alvos[0].senioridade} · ${alvos[0].titulo}`;
  }
  return `${alvos.length} cargos selecionados`;
}
