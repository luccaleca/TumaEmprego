/**
 * Detecção de portal por URL — sem dependências de Node (uso em API e testes).
 */

/** @typedef {{ id: string, dominios: string[], status?: string, nome?: string }} PortalDominio */

/**
 * @param {string} url
 * @param {PortalDominio[]} catalogo
 * @returns {string | null} portal id
 */
export function detectarPortalPorUrl(url, catalogo) {
  const raw = String(url ?? "").toLowerCase();
  if (!raw || !catalogo?.length) return null;

  for (const portal of catalogo) {
    if (portal.dominios?.some((d) => raw.includes(String(d).toLowerCase()))) {
      return portal.id;
    }
  }
  return null;
}

/**
 * Normaliza URL de vaga para comparação (sem hash/query trailing slash).
 * @param {string} url
 */
export function normalizarVagaUrl(url) {
  const raw = String(url ?? "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    parsed.hash = "";
    let path = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${parsed.origin}${path}${parsed.search}`;
  } catch {
    return raw.split("#")[0].replace(/\/+$/, "");
  }
}
