export function normalizarTexto(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function tokenizarConsulta(query) {
  return normalizarTexto(query).split(/\s+/).filter(Boolean);
}

function noCombina(no, tokens) {
  const nome = normalizarTexto(no.nome);
  return tokens.every((token) => nome.includes(token));
}

export function filtrarArvore(arvore, query) {
  const tokens = tokenizarConsulta(query);
  if (!tokens.length) return arvore ?? [];

  function filterNode(no) {
    const selfMatch = noCombina(no, tokens);
    const filhosFiltrados = (no.filhos ?? []).map(filterNode).filter(Boolean);

    if (selfMatch) return { ...no };
    if (filhosFiltrados.length) return { ...no, filhos: filhosFiltrados };
    return null;
  }

  return (arvore ?? []).map(filterNode).filter(Boolean);
}

export function buscarNaArvore(arvore, query) {
  const tokens = tokenizarConsulta(query);
  const base = arvore ?? [];

  if (!tokens.length) {
    return { resultados: [], highlightIds: new Set(), arvoreFiltrada: base };
  }

  const resultados = [];
  const highlightIds = new Set();

  function walk(nos, caminho) {
    for (const no of nos) {
      const path = [...caminho, no];
      const match = noCombina(no, tokens);

      if (match) {
        highlightIds.add(no.id);
        for (const item of path) highlightIds.add(item.id);

        resultados.push({
          id: no.id,
          nome: no.nome,
          caminho: path.map((n) => n.nome).join(" → "),
          ativo: Boolean(no.ativo),
        });
      }

      walk(no.filhos ?? [], path);
    }
  }

  walk(base, []);

  return {
    resultados,
    highlightIds,
    arvoreFiltrada: filtrarArvore(base, query),
  };
}
