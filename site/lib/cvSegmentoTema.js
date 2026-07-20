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

/** Marcas curtas conhecidas (card do Currículo). */
const EMPRESA_CURTA = [
  { match: /\bsafra\b/i, curta: "SAFRA" },
  { match: /\bcreditas\b/i, curta: "CREDITAS" },
  { match: /\bcordial\b/i, curta: "CORDIAL" },
  { match: /\bmajors\b/i, curta: "MAJORS" },
];

function empresaDeUrl(vagaUrl) {
  try {
    const host = new URL(String(vagaUrl ?? "")).hostname.replace(/^www\./i, "");
    const primeiro = host.split(".")[0] || "";
    if (!primeiro || /^(vagas|app|jobs|careers|portal)$/i.test(primeiro)) return "";
    return primeiro.replace(/[-_]+/g, " ");
  } catch {
    return "";
  }
}

/** Nome curto da empresa para o card (ex.: SAFRA). */
export function empresaCurtaCv(empresa, ctx = {}) {
  const bruto = String(empresa ?? "").trim() || empresaDeUrl(ctx.vaga_url);
  if (!bruto) return "";

  for (const item of EMPRESA_CURTA) {
    if (item.match.test(bruto) || item.match.test(String(ctx.vaga_url ?? ""))) {
      return item.curta;
    }
  }

  const limpa = bruto
    .replace(/\b(ltda|me|eireli|s\.?a\.?|ss|ltd|inc|corp)\b\.?/gi, " ")
    .replace(/\b(instituto|banco|empresa|de|da|do|dos|das|e)\b/gi, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!limpa) {
    return bruto.slice(0, 24).toUpperCase();
  }

  const partes = limpa.split(/\s+/).filter(Boolean);
  const escolhidas = partes.length <= 2 ? partes : partes.slice(0, 2);
  return escolhidas.join(" ").toUpperCase();
}

/**
 * Título do CV na área Currículo / extensão.
 * Vaga: `SAFRA-Estágio em Engenharia de Dados`
 * Segmento base: label do segmento.
 */
export function labelCvVaga(segmentacao) {
  if (!segmentacao) return "Vaga";
  if (segmentacao.origem === "busca" || segmentacao.origem === "segmento" || segmentacao.slot) {
    return labelSegmento(segmentacao);
  }

  const emp = empresaCurtaCv(segmentacao.vaga_empresa, {
    vaga_url: segmentacao.vaga_url,
  });
  const titulo = String(segmentacao.vaga_titulo ?? "").trim();
  if (emp && titulo) return `${emp}-${titulo}`;
  if (titulo) return titulo;
  return emp || "Vaga";
}

export function resumoAlvos(segmentacao) {
  const alvos = segmentacao?.alvos ?? [];
  if (!alvos.length) return "CV geral do segmento";
  if (alvos.length === 1) {
    return `${alvos[0].senioridade} · ${alvos[0].titulo}`;
  }
  return `${alvos.length} cargos selecionados`;
}
