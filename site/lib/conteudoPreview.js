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

export function montarPreviewExperienciasSecao(experiencias, slug) {
  return (experiencias ?? [])
    .map((exp) => montarPreviewExperiencia(exp, slug))
    .filter(Boolean);
}

export function formatarPreviewMarkdown(blocos) {
  if (!blocos?.length) {
    return "Nenhuma experiência para esta área. Marque os segmentos na edição.";
  }

  return blocos
    .map((b) => {
      const periodo = [b.periodo, b.local].filter(Boolean).join(" · ");
      const lines = [`### ${b.titulo}`, "", periodo ? `**Período:** ${periodo}` : "", ""];
      if (b.bullets.length) {
        lines.push(...b.bullets.map((t) => `- ${t}`));
      } else {
        lines.push("- (sem entregas marcadas para esta área)");
      }
      if (b.nota) lines.push("", `*${b.nota}*`);
      return lines.filter((l) => l !== "").join("\n");
    })
    .join("\n\n");
}
