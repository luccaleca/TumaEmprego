import { prisma } from "@/lib/prisma";

export function chaveTitulo(areaSlug, nichoSlug, titulo) {
  return `${areaSlug}/${nichoSlug}/${titulo}`;
}

export async function getVagaCatalogo() {
  try {
    const areas = await prisma.vagaArea.findMany({
      orderBy: { ordem: "asc" },
      include: {
        nichos: {
          orderBy: { ordem: "asc" },
          include: {
            titulos: { orderBy: { titulo: "asc" } },
          },
        },
        palavrasChave: { orderBy: { termo: "asc" } },
      },
    });

    return areas.map((area) => ({
      id: area.id,
      slug: area.slug,
      nome: area.nome,
      titulosRaiz: area.titulosRaiz,
      palavrasChave: area.palavrasChave.map((p) => p.termo),
      nichos: area.nichos.map((nicho) => ({
        id: nicho.id,
        slug: nicho.slug,
        nome: nicho.nome,
        titulos: nicho.titulos.map((t) => ({
          id: t.id,
          titulo: t.titulo,
          sinonimos: t.sinonimos,
          chave: chaveTitulo(area.slug, nicho.slug, t.titulo),
        })),
      })),
    }));
  } catch (err) {
    console.warn("[vagaCatalogo] banco indisponível:", err?.message ?? err);
    return [];
  }
}

export function listarTitulosAtivos(catalogo, chavesAtivas) {
  const set = new Set(chavesAtivas ?? []);
  const lista = [];

  for (const area of catalogo ?? []) {
    for (const nicho of area.nichos ?? []) {
      for (const titulo of nicho.titulos ?? []) {
        if (set.has(titulo.chave)) {
          lista.push({
            chave: titulo.chave,
            titulo: titulo.titulo,
            nicho: nicho.nome,
            area: area.nome,
          });
        }
      }
    }
  }

  return lista;
}
