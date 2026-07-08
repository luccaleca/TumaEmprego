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

  const itens = Array.isArray(entrada.itens)
    ? entrada.itens
        .filter((i) => i?.slug && ativas.includes(i.slug))
        .map((i) => ({
          slug: i.slug,
          nome: i.nome,
          categoria: i.categoria ?? "",
          vertenteSlug: i.vertenteSlug ?? i.vertente ?? "",
          vertenteNome: i.vertenteNome ?? "",
          segmentosCv: Array.isArray(i.segmentosCv) ? i.segmentosCv : [],
        }))
    : [];

  return { ativas, itens };
}
