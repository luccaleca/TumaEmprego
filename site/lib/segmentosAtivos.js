/**
 * Segmentos ativos em dados/config/busca.yml — mesma fonte que a página Segmentos.
 */

import { getBusca } from "./dados.js";
import { LABELS_SEGMENTO, SEGMENTOS_CV_SLOTS } from "./conteudoConstants.js";

export function slugsSegmentosAtivos() {
  return (getBusca().segmentos_ativos ?? []).filter(Boolean);
}

export function segmentoEstaAtivo(slug) {
  const ativos = slugsSegmentosAtivos();
  if (!ativos.length) return false;
  return ativos.includes(slug);
}

/** Lista { slug, label } na ordem de segmentos_ativos. */
export function resolverSegmentosAtivos(catalogo) {
  return slugsSegmentosAtivos().map((slug) => {
    const area = (catalogo ?? []).find((a) => a.slug === slug);
    return {
      slug,
      label: area?.nome ?? LABELS_SEGMENTO[slug] ?? slug,
    };
  });
}

/** Catálogo completo de áreas (slots de CV) — para inventário em Conteúdo. */
export function listarTodosSegmentosCatalogo(catalogo) {
  return SEGMENTOS_CV_SLOTS.map((slug) => {
    const area = (catalogo ?? []).find((a) => a.slug === slug);
    return {
      slug,
      label: area?.nome ?? LABELS_SEGMENTO[slug] ?? slug,
    };
  });
}
