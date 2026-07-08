import { prisma } from "@/lib/prisma";
import { isTecnologiaPopular } from "@/lib/tecnologiasPopulares.js";

export async function getTecnologiaCatalogo() {
  const vertentes = await prisma.tecnologiaVertente.findMany({
    orderBy: { ordem: "asc" },
    include: {
      itens: { orderBy: [{ categoria: "asc" }, { ordem: "asc" }, { nome: "asc" }] },
    },
  });

  return vertentes.map((v) => ({
    id: v.id,
    slug: v.slug,
    nome: v.nome,
    itens: v.itens.map((item) => ({
      id: item.id,
      slug: item.slug,
      nome: item.nome,
      categoria: item.categoria,
      segmentosCv: item.segmentosCv,
      popular: isTecnologiaPopular(v.slug, item.slug),
      vertenteSlug: v.slug,
      vertenteNome: v.nome,
    })),
  }));
}

/** Mapa slug → item (todas as vertentes). */
export function mapaCatalogoPorSlug(catalogo) {
  const mapa = new Map();
  for (const vertente of catalogo ?? []) {
    for (const item of vertente.itens ?? []) {
      mapa.set(item.slug, { ...item, vertenteSlug: vertente.slug, vertenteNome: vertente.nome });
    }
  }
  return mapa;
}

export function resolverItensAtivos(catalogo, slugsAtivos) {
  const mapa = mapaCatalogoPorSlug(catalogo);
  const itens = [];

  for (const slug of slugsAtivos ?? []) {
    const item = mapa.get(slug);
    if (item) itens.push(item);
  }

  return itens;
}
