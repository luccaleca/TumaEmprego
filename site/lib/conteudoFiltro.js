/** Escopo "Tudo" na aba Conteúdo — inventário completo, sem filtro por área. */
export const ESCOPO_TUDO = "tudo";

export function escopoEhTudo(scope) {
  return !scope || scope === ESCOPO_TUDO;
}

/** Itens com campo `segmentos[]` visíveis no escopo atual. */
export function filtrarItensPorEscopo(items, scope) {
  const lista = items ?? [];
  if (escopoEhTudo(scope)) return lista;
  return lista.filter((item) => (item.segmentos ?? []).includes(scope));
}

export function contarItensPorEscopo(items, scope) {
  return filtrarItensPorEscopo(items, scope).length;
}
