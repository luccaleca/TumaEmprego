/** @deprecated Chips legados — migração automática para slugs do catálogo. */
export const CAMPOS_NIVEL = [
  { key: "excel", label: "Excel", slug: "excel" },
  { key: "sql", label: "SQL", slug: "sql" },
  { key: "power_bi", label: "Power BI", slug: "power-bi" },
  { key: "python", label: "Python", slug: "python" },
  { key: "javascript", label: "JavaScript", slug: "javascript" },
  { key: "git", label: "Git", slug: "git" },
  { key: "postgresql", label: "PostgreSQL", slug: "postgresql" },
];

/** Marcada no perfil = domínio intermediário (não exibimos o rótulo no CV). */
export function tecnologiaMarcada(value) {
  if (value === true) return true;
  if (value === false) return false;
  const texto = String(value ?? "").trim();
  return Boolean(texto);
}

function migrarLegadoParaAtivas(entrada) {
  const ativas = [];
  for (const campo of CAMPOS_NIVEL) {
    if (tecnologiaMarcada(entrada[campo.key])) {
      ativas.push(campo.slug);
    }
  }
  return ativas;
}

export function normalizarTecnologias(raw) {
  const entrada = raw ?? {};
  let ativas = Array.isArray(entrada.ativas) ? entrada.ativas.filter(Boolean) : [];

  if (!ativas.length) {
    ativas = migrarLegadoParaAtivas(entrada);
  }

  ativas = [...new Set(ativas.map((s) => String(s).trim()).filter(Boolean))];

  const overrides = entrada.segmentos && typeof entrada.segmentos === "object" ? entrada.segmentos : {};

  const itens = Array.isArray(entrada.itens)
    ? entrada.itens
        .filter((i) => i?.slug && ativas.includes(i.slug))
        .map((i) => {
          const segmentosOverride = overrides[i.slug];
          const segmentosCv = Array.isArray(segmentosOverride) && segmentosOverride.length
            ? segmentosOverride.filter(Boolean)
            : Array.isArray(i.segmentosCv)
              ? i.segmentosCv.filter(Boolean)
              : [];
          return {
            slug: i.slug,
            nome: i.nome,
            categoria: i.categoria ?? "",
            vertenteSlug: i.vertenteSlug ?? i.vertente ?? "",
            vertenteNome: i.vertenteNome ?? "",
            segmentosCv,
          };
        })
    : [];

  const extras = Array.isArray(entrada.extras)
    ? entrada.extras
        .map((e) => {
          const nome = String(e?.nome ?? "").trim();
          if (!nome) return null;
          return {
            id: String(e?.id ?? `extra-${nome}`).trim(),
            nome,
            categoria: String(e?.categoria ?? "Ferramentas").trim() || "Ferramentas",
            segmentos: Array.isArray(e?.segmentos) ? e.segmentos.filter(Boolean) : [],
          };
        })
        .filter(Boolean)
    : [];

  return { ativas, itens, extras, segmentos: overrides };
}
