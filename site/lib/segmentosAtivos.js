/**
 * Segmentos ativos em dados/config/busca.yml — mesma fonte que a página Segmentos.
 */

import { getBusca } from "./dados.js";
import { LABELS_SEGMENTO } from "./conteudoConstants.js";

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

export function filtrarSegmentosItem(segmentos, ativos = slugsSegmentosAtivos()) {
  const set = new Set(ativos);
  return (segmentos ?? []).filter((s) => set.has(s));
}

export function podarBancoPorSegmentosAtivos(banco) {
  const ativos = slugsSegmentosAtivos();
  if (!ativos.length) return banco;

  const podar = (segmentos) => filtrarSegmentosItem(segmentos, ativos);

  return {
    ...banco,
    experiencias: (banco.experiencias ?? []).map((exp) => ({
      ...exp,
      segmentos: podar(exp.segmentos),
      bullets: (exp.bullets ?? []).map((b) => ({
        ...b,
        segmentos: podar(b.segmentos),
      })),
    })),
    projetos: (banco.projetos ?? []).map((p) => ({
      ...p,
      segmentos: podar(p.segmentos),
    })),
    cursos: (banco.cursos ?? []).map((c) => ({
      ...c,
      segmentos: podar(c.segmentos),
    })),
    ferramentas: (banco.ferramentas ?? []).map((f) => ({
      ...f,
      segmentos: podar(f.segmentos),
    })),
  };
}
