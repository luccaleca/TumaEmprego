/** Lista plana do perfil — só o que está no catálogo e marcado. */
export function extrairTecnologiasPerfil(tecnologias) {
  if (!tecnologias) return { comNivel: [], todas: [] };

  const comNivel = (tecnologias.itens ?? []).map((item) => ({
    nome: item.nome,
    slug: item.slug,
    categoria: item.categoria ?? "",
    vertenteSlug: item.vertenteSlug ?? "",
    segmentosCv: item.segmentosCv ?? [],
  }));

  const todas = comNivel.map((t) => t.nome);

  return { comNivel, todas: [...new Set(todas)] };
}
