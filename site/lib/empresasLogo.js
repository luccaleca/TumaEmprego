/**
 * Logos locais de empresas conhecidas — cards do Status.
 * Paths em site/public/empresas/
 */

const LOGOS = [
  {
    id: "safra",
    empresa: "Banco Safra",
    url: "/empresas/safra.png",
    match: /\bsafra\b/i,
  },
  {
    id: "creditas",
    empresa: "Creditas",
    url: "/empresas/creditas.png",
    match: /\bcreditas\b/i,
  },
  {
    id: "majors",
    empresa: "Majors Asset",
    url: "/empresas/majors-asset.png",
    match: /\bmajors(\s*asset)?\b/i,
  },
];

function blobCandidatura({ empresa, vaga_titulo, vaga_url } = {}) {
  return `${empresa ?? ""} ${vaga_titulo ?? ""} ${vaga_url ?? ""}`;
}

/** Match por empresa, título ou URL da vaga. */
export function resolverLogoEmpresa(ctx = {}) {
  const blob = blobCandidatura(ctx);
  if (!blob.trim()) return null;
  return LOGOS.find((item) => item.match.test(blob)) ?? null;
}

/** Preenche logo_url (e empresa se vazia) quando reconhecer a marca. */
export function enriquecerLogoCandidatura(item) {
  if (!item) return item;
  const hit = resolverLogoEmpresa(item);
  if (!hit) return item;
  return {
    ...item,
    logo_url: item.logo_url || hit.url,
    empresa: item.empresa?.trim() ? item.empresa : hit.empresa,
  };
}
