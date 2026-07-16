import { normalizarTexto, tokenizarConsulta } from "@/lib/buscaBusca";
import { tituloCompativelComSenioridades } from "@/lib/tituloSenioridade";

/** Texto de busca: título canônico + sinônimos de portal. */
function textoBuscaTitulo(titulo) {
  return [titulo?.titulo, ...(titulo?.sinonimos ?? [])].filter(Boolean).join(" ");
}

/** Match AND: cada token como palavra (ou junção tipo fullstack = full stack). */
function tokensBatam(texto, tokens) {
  if (!tokens?.length) return false;
  const blob = normalizarTexto(texto);
  const padded = ` ${blob} `;
  const words = blob.split(/\s+/).filter(Boolean);

  return tokens.every((token) => {
    if (padded.includes(` ${token} `)) return true;

    const compactToken = token.replace(/\s+/g, "");
    if (compactToken.length < 4) return false;

    for (let i = 0; i < words.length; i++) {
      let joined = "";
      for (let j = i; j < words.length; j++) {
        joined += words[j];
        if (joined === compactToken) return true;
        if (joined.length > compactToken.length) break;
      }
    }
    return false;
  });
}

function flattenCatalogo(catalogo) {
  const itens = [];

  for (const area of catalogo ?? []) {
    for (const nicho of area.nichos ?? []) {
      for (const titulo of nicho.titulos ?? []) {
        const textoTitulo = textoBuscaTitulo(titulo);
        itens.push({
          chave: titulo.chave,
          id: titulo.chave,
          titulo: titulo.titulo,
          sinonimos: titulo.sinonimos ?? [],
          area: area.nome,
          areaSlug: area.slug,
          nicho: nicho.nome,
          nichoSlug: nicho.slug,
          caminho: `${area.nome} → ${nicho.nome} → ${titulo.titulo}`,
          // Só título + sinônimos + nicho — área/titulosRaiz poluem (ex.: "BI" em todos de dados)
          textoBusca: [textoTitulo, nicho.nome].join(" "),
        });
      }
    }
  }

  return itens;
}

export function buscarNoCatalogo(catalogo, query, chavesAtivas = [], senioridades = ["estagio"]) {
  const tokens = tokenizarConsulta(query);
  const ativos = new Set(chavesAtivas);
  const itens = flattenCatalogo(catalogo);

  if (!tokens.length) {
    return { resultados: [], highlightChaves: new Set(), catalogoFiltrado: catalogo };
  }

  const highlightChaves = new Set();
  const resultados = [];

  for (const item of itens) {
    if (!tituloCompativelComSenioridades(item.titulo, senioridades)) continue;

    if (!tokensBatam(item.textoBusca, tokens)) continue;

    highlightChaves.add(item.chave);
    resultados.push({
      id: item.chave,
      nome: item.titulo,
      caminho: `${item.area} → ${item.nicho}`,
      ativo: ativos.has(item.chave),
      matchViaSinonimo:
        item.sinonimos?.length > 0 &&
        tokensBatam(item.sinonimos.join(" "), tokens) &&
        !tokensBatam(item.titulo, tokens),
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
