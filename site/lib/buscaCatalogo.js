import { normalizarTexto, tokenizarConsulta } from "@/lib/buscaBusca";

function textoTitulo(titulo) {
  return normalizarTexto([titulo.titulo, ...(titulo.sinonimos ?? [])].join(" "));
}

export function flattenCatalogo(catalogo) {
  const itens = [];

  for (const area of catalogo ?? []) {
    for (const nicho of area.nichos ?? []) {
      for (const titulo of nicho.titulos ?? []) {
        itens.push({
          chave: titulo.chave,
          id: titulo.chave,
          titulo: titulo.titulo,
          area: area.nome,
          areaSlug: area.slug,
          nicho: nicho.nome,
          nichoSlug: nicho.slug,
          caminho: `${area.nome} → ${nicho.nome} → ${titulo.titulo}`,
        });
      }
    }
  }

  return itens;
}

export function buscarNoCatalogo(catalogo, query, chavesAtivas = []) {
  const tokens = tokenizarConsulta(query);
  const ativos = new Set(chavesAtivas);
  const itens = flattenCatalogo(catalogo);

  if (!tokens.length) {
    return { resultados: [], highlightChaves: new Set(), catalogoFiltrado: catalogo };
  }

  const highlightChaves = new Set();
  const resultados = [];

  for (const item of itens) {
    const blob = normalizarTexto(
      [item.titulo, item.area, item.nicho, item.caminho].join(" "),
    );
    const match = tokens.every((token) => blob.includes(token));
    if (!match) continue;

    highlightChaves.add(item.chave);
    resultados.push({
      id: item.chave,
      nome: item.titulo,
      caminho: `${item.area} → ${item.nicho}`,
      ativo: ativos.has(item.chave),
    });
  }

  const catalogoFiltrado = (catalogo ?? [])
    .map((area) => {
      const nichos = (area.nichos ?? [])
        .map((nicho) => {
          const titulos = (nicho.titulos ?? []).filter((t) => highlightChaves.has(t.chave));
          return titulos.length ? { ...nicho, titulos } : null;
        })
        .filter(Boolean);
      return nichos.length ? { ...area, nichos } : null;
    })
    .filter(Boolean);

  return { resultados, highlightChaves, catalogoFiltrado };
}

export function filtrarCatalogoPorArea(catalogo, areaSlug) {
  if (!areaSlug) return catalogo;
  return catalogo.filter((a) => a.slug === areaSlug);
}
