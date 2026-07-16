import { listarStackItens } from "./tecnologiasStack.js";

/** Lista plana do perfil — catálogo ativo + extras. */
export function extrairTecnologiasPerfil(tecnologias) {
  if (!tecnologias) return { comNivel: [], todas: [] };

  const comNivel = listarStackItens(tecnologias).map((item) => ({
    nome: item.nome,
    slug: item.slug ?? item.id,
    categoria: item.categoria ?? "",
    vertenteSlug: item.vertenteSlug ?? "",
    segmentosCv: item.segmentos ?? item.segmentosCv ?? [],
    origem: item.origem ?? "catalogo",
  }));

  const todas = comNivel.map((t) => t.nome);

  return { comNivel, todas: [...new Set(todas)] };
}
