export const SEGMENTOS = [
  { slug: "dados-bi-analytics", label: "Dados, BI e Analytics" },
  { slug: "desenvolvimento", label: "Desenvolvimento" },
  { slug: "marketing-growth", label: "Marketing / Growth" },
  { slug: "ia-ml", label: "IA / ML" },
];

export function slugParaLabel(slug) {
  return SEGMENTOS.find((s) => s.slug === slug)?.label ?? slug;
}
