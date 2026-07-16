import { LABELS_SEGMENTO, SEGMENTOS_CV_SLOTS } from "./conteudoConstants.js";
import { isSlotSegmento } from "./segmentacoes.js";

const OUTRAS_SLUG = "_outras";

/**
 * Agrupa slots e candidaturas por segmento ativo (colunas do board).
 * @param {object[]} segmentacoes
 * @param {string[]} segmentosAtivos
 */
export function montarColunasCurriculo(segmentacoes, segmentosAtivos = []) {
  const ativos = segmentosAtivos?.length ? segmentosAtivos : [];
  const ordem = SEGMENTOS_CV_SLOTS.filter((slug) => ativos.includes(slug));

  const colunas = ordem.map((slug) => ({
    slug,
    label: LABELS_SEGMENTO[slug] ?? slug,
    slot: null,
    candidaturas: [],
    manuais: [],
  }));

  const outras = {
    slug: OUTRAS_SLUG,
    label: "Outras",
    slot: null,
    candidaturas: [],
    manuais: [],
  };

  for (const seg of segmentacoes ?? []) {
    if (isSlotSegmento(seg)) {
      const col = colunas.find((c) => c.slug === seg.segmento_slug);
      if (col) col.slot = seg;
      continue;
    }

    if (seg.origem === "vaga") {
      const col = colunas.find((c) => c.slug === seg.segmento_slug);
      if (col) col.candidaturas.push(seg);
      else outras.candidaturas.push(seg);
      continue;
    }

    if (seg.origem === "manual") {
      outras.manuais.push(seg);
    }
  }

  const sortRecente = (a, b) => String(b.criado_em ?? "").localeCompare(String(a.criado_em ?? ""));

  for (const col of colunas) {
    col.candidaturas.sort(sortRecente);
  }
  outras.candidaturas.sort(sortRecente);
  outras.manuais.sort(sortRecente);

  if (outras.candidaturas.length || outras.manuais.length) {
    colunas.push(outras);
  }

  return colunas;
}
