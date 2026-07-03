/** Áreas do catálogo — uma variação fixa de currículo por slot (sempre existe; oculta se inativa). */
export const SEGMENTOS_CV_SLOTS = [
  "dados-bi-analytics",
  "desenvolvimento",
  "engenharia-software",
  "marketing-growth",
  "ia-ml",
];

/** Rótulos fallback quando o slug não está no catálogo Prisma. */
export const LABELS_SEGMENTO = {
  "dados-bi-analytics": "Dados, BI e Analytics",
  desenvolvimento: "Desenvolvimento",
  "marketing-growth": "Marketing e Growth",
  "ia-ml": "IA / ML",
  "engenharia-software": "Engenharia de Software",
};

/** @deprecated Use segmentosAtivos da API / busca.yml */
export const SEGMENTOS = Object.entries(LABELS_SEGMENTO).map(([slug, label]) => ({
  slug,
  label,
}));

export function slugParaLabel(slug, segmentosAtivos) {
  const fromList = segmentosAtivos?.find((s) => s.slug === slug);
  if (fromList) return fromList.label;
  return LABELS_SEGMENTO[slug] ?? slug;
}
