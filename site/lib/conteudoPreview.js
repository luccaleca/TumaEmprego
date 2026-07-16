/**
 * Prévia client-safe do bloco Experiência no CV (sem fs).
 */

export function montarPreviewExperiencia(exp, slug) {
  if (!(exp?.segmentos ?? []).includes(slug)) return null;

  const bullets = (exp.bullets ?? [])
    .filter((b) => (b.segmentos ?? []).includes(slug))
    .map((b) => b.texto_por_segmento?.[slug]?.trim() || b.texto?.trim())
    .filter(Boolean);

  return {
    id: exp.id,
    titulo: exp.titulo_por_segmento?.[slug]?.trim() || exp.empresa?.trim() || "—",
    periodo: exp.periodo,
    local: exp.local,
    nota: exp.nota_por_segmento?.[slug]?.trim() ?? "",
    bullets,
  };
}

/** Inventário completo — empresa + entregas de todas as áreas marcadas. */
export function montarPreviewExperienciaTudo(exp) {
  if (!exp) return null;

  const segmentos = exp.segmentos ?? [];
  const bullets = [];

  for (const b of exp.bullets ?? []) {
    for (const slug of b.segmentos ?? []) {
      const text =
        b.texto_por_segmento?.[slug]?.trim() ||
        (b.segmentos?.length === 1 ? b.texto?.trim() : "");
      if (text) bullets.push({ text, slug });
    }
  }

  if (!segmentos.length && !bullets.length) return null;

  return {
    id: exp.id,
    titulo: exp.empresa?.trim() || "—",
    periodo: exp.periodo,
    local: exp.local,
    segmentos,
    bullets,
  };
}
