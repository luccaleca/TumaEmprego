import { OPCOES_SENIORIDADE } from "@/lib/senioridadeOpcoes";

/** Ordem crescente — combinações só são válidas se senioridade >= mínima do título. */
const ORDEM_SENIORIDADE = Object.fromEntries(OPCOES_SENIORIDADE.map((slug, i) => [slug, i]));

/**
 * Inferência a partir do nome do cargo no catálogo (sem senioridade explícita no slug).
 * Títulos neutros (Analista, Desenvolvedor…) aceitam qualquer nível, inclusive Estágio.
 */
export function senioridadeMinimaDoTitulo(titulo) {
  const t = String(titulo ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

  if (
    /\bespecialista\b/.test(t) ||
    /^profissional de\b/.test(t) ||
    /\bconsultor(a)? de\b/.test(t) ||
    /\bgestor(a)? de\b/.test(t)
  ) {
    return "pleno";
  }

  if (
    /\bcoordenador(a)?\b/.test(t) ||
    /\bgerente\b/.test(t) ||
    /\bmanager\b/.test(t) ||
    /\barquitet[oa]\b/.test(t) ||
    /\btech lead\b/.test(t) ||
    /\blider\b/.test(t) ||
    /\blíder\b/.test(t) ||
    /\bdiretor(a)?\b/.test(t)
  ) {
    return "senior";
  }

  return "banco-de-talentos";
}

export function indiceSenioridade(slug) {
  return ORDEM_SENIORIDADE[slug] ?? 0;
}

export function combinacaoSenioridadeTituloValida(senioridadeSlug, titulo) {
  const minima = senioridadeMinimaDoTitulo(titulo);
  return indiceSenioridade(senioridadeSlug) >= indiceSenioridade(minima);
}

export function tituloTextoFromChave(chave) {
  return String(chave).split("/").slice(2).join("/");
}

export function tituloCompativelComSenioridades(titulo, senioridades) {
  const niveis = senioridades?.length ? senioridades : ["estagio"];
  return niveis.some((s) => combinacaoSenioridadeTituloValida(s, titulo));
}

export function filtrarChavesTituloPorSenioridade(chaves, senioridades) {
  const niveis = senioridades?.length ? senioridades : ["estagio"];
  return (chaves ?? []).filter((chave) => {
    const titulo = tituloTextoFromChave(chave);
    return niveis.some((s) => combinacaoSenioridadeTituloValida(s, titulo));
  });
}

export function listarChavesTituloCompativeis(catalogo, senioridades) {
  const chaves = [];
  for (const area of catalogo ?? []) {
    for (const nicho of area.nichos ?? []) {
      for (const titulo of nicho.titulos ?? []) {
        if (
          (senioridades ?? ["estagio"]).some((s) =>
            combinacaoSenioridadeTituloValida(s, titulo.titulo),
          )
        ) {
          chaves.push(titulo.chave);
        }
      }
    }
  }
  return chaves;
}
