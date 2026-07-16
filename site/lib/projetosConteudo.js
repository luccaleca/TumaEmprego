/** Helpers para finalidade, stack com uso e resultados por segmento. */

export function resumoProjeto(proj, slug) {
  return (
    proj?.resumo_por_segmento?.[slug]?.trim() ||
    proj?.subtitulo_por_segmento?.[slug]?.trim() ||
    ""
  );
}

export function stackUsoProjeto(proj, slug) {
  const lista = proj?.stack_uso_por_segmento?.[slug];
  if (Array.isArray(lista) && lista.length) return lista;

  const legado = proj?.stack_por_segmento?.[slug];
  if (typeof legado === "string" && legado.trim()) {
    return legado.split(",").map((tech) => ({ tech: tech.trim(), uso: "" }));
  }

  return [];
}

export function bulletsProjeto(proj, slug) {
  return proj?.bullets_por_segmento?.[slug] ?? [];
}

export function projetoTemConteudoNoSegmento(proj, slug) {
  return Boolean(
    resumoProjeto(proj, slug) ||
      stackUsoProjeto(proj, slug).length ||
      bulletsProjeto(proj, slug).length,
  );
}

export function rotuloStackUso(item) {
  if (typeof item === "string") return item.trim();
  const tech = String(item?.tech ?? "").trim();
  const uso = String(item?.uso ?? "").trim();
  if (!tech) return "";
  return uso ? `${tech} — ${uso}` : tech;
}

export function stackUsoParaTexto(itens) {
  return (itens ?? []).map(rotuloStackUso).filter(Boolean).join("\n");
}

export function textoParaStackUso(texto) {
  return String(texto ?? "")
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean)
    .map((linha) => {
      const separador = linha.includes(" — ") ? " — " : linha.includes(" - ") ? " - " : null;
      if (!separador) return { tech: linha, uso: "" };
      const [tech, ...resto] = linha.split(separador);
      return { tech: tech.trim(), uso: resto.join(separador).trim() };
    });
}
