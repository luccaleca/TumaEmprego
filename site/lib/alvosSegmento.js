import { expandirAlvosCandidatura, preferenciasFromBusca } from "@/lib/preferenciasBusca";
import { listarTitulosAtivos } from "@/lib/vagaCatalogo";

export function areaSlugFromChave(chave) {
  return String(chave).split("/")[0];
}

export function listarCurriculosSegmento(catalogo, busca) {
  const preferencias = preferenciasFromBusca(busca);
  const todos = listarTitulosAtivos(catalogo, busca?.titulos_ativos ?? []);
  const segmentos = busca?.segmentos_ativos ?? [];

  return segmentos.map((slug) => {
    const area = (catalogo ?? []).find((a) => a.slug === slug);
    const primarios = todos.filter((t) => areaSlugFromChave(t.chave) === slug);
    const complementares = todos.filter((t) => areaSlugFromChave(t.chave) !== slug);

    return {
      slug,
      nome: area?.nome ?? slug,
      primarios: expandirAlvosCandidatura(primarios, preferencias.senioridades),
      complementares: expandirAlvosCandidatura(complementares, preferencias.senioridades),
    };
  });
}

export function cargoEhComplemento(chave, segmentosAtivos) {
  const slug = areaSlugFromChave(chave);
  const set = new Set(segmentosAtivos ?? []);
  return set.size > 0 && !set.has(slug);
}

export function contarAlvosTotais(catalogo, busca) {
  const preferencias = preferenciasFromBusca(busca);
  const todos = listarTitulosAtivos(catalogo, busca?.titulos_ativos ?? []);
  return expandirAlvosCandidatura(todos, preferencias.senioridades).length;
}
