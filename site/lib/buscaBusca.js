export function normalizarTexto(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_/.,()+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizarConsulta(query) {
  return normalizarTexto(query).split(/\s+/).filter(Boolean);
}
