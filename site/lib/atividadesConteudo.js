/**
 * Pool de atividades de estágio (dados/conteudo/atividades.yml) — provas flexíveis.
 */

import { getConteudoAtividades } from "./dados.js";

const SLUG_ALIASES = {
  "engenharia-software": "desenvolvimento",
};

function normalizeSlug(slug) {
  return SLUG_ALIASES[slug] ?? slug;
}

function normalize(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function loadAtividades() {
  try {
    return getConteudoAtividades() ?? { atividades: [] };
  } catch {
    return { atividades: [] };
  }
}

/** Texto da atividade no ângulo do segmento (reframe). */
export function textoAtividadeParaSegmento(atividade, slug) {
  const key = normalizeSlug(slug);
  return (
    atividade?.texto_por_segmento?.[key]?.trim() ||
    atividade?.texto?.trim() ||
    ""
  );
}

/** Atividades do segmento, ranqueadas: reframe rico + específicas + termos da vaga. */
export function atividadesParaSegmento(slug, termos = []) {
  const data = loadAtividades();
  const key = normalizeSlug(slug);
  const lista = (data.atividades ?? []).filter((a) =>
    (a.segmentos ?? []).includes(key),
  );

  const tNorm = termos.map(normalize).filter(Boolean);

  return [...lista].sort((a, b) => {
    const score = (item) => {
      const segs = item.segmentos ?? [];
      let s = 0;
      if (item.texto_por_segmento?.[key]) s += 25;
      if (segs[0] === key) s += 20;
      if (segs.length === 1) s += 15;
      else s += Math.max(0, 8 - segs.length);
      const blob = normalize(textoAtividadeParaSegmento(item, key));
      s += tNorm.reduce((n, t) => n + (blob.includes(t) ? 2 : 0), 0);
      return s;
    };
    return score(b) - score(a);
  });
}

/** Uma prova (texto) do pool — índice 0, 1… para variar exemplos. */
export function provaDeAtividade(slug, { termos = [], indice = 0 } = {}) {
  const lista = atividadesParaSegmento(slug, termos);
  const item = lista[indice] ?? lista[0];
  return textoAtividadeParaSegmento(item, slug);
}

/** Textos prontos pra Experiência (sem duplicar os que já estão no banco). */
export function bulletsAtividadesParaSegmento(slug, { termos = [], max = 4, existentes = [] } = {}) {
  const jaTem = new Set(
    existentes.map((t) => normalize(t).slice(0, 48)).filter(Boolean),
  );
  const out = [];
  for (const a of atividadesParaSegmento(slug, termos)) {
    const texto = textoAtividadeParaSegmento(a, slug);
    if (!texto) continue;
    const chave = normalize(texto).slice(0, 48);
    if (jaTem.has(chave)) continue;
    jaTem.add(chave);
    out.push(texto);
    if (out.length >= max) break;
  }
  return out;
}
