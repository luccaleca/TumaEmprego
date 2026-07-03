import { OPCOES_MODALIDADE } from "@/lib/buscaOpcoes";
import { labelSenioridade, OPCOES_SENIORIDADE } from "@/lib/senioridadeOpcoes";
import { combinacaoSenioridadeTituloValida } from "@/lib/tituloSenioridade";

export function normalizarSenioridades(fonte) {
  if (Array.isArray(fonte?.senioridades) && fonte.senioridades.length) {
    return fonte.senioridades.filter((s) => OPCOES_SENIORIDADE.includes(s));
  }
  if (fonte?.nivel && OPCOES_SENIORIDADE.includes(fonte.nivel)) {
    return [fonte.nivel];
  }
  return ["estagio"];
}

export function normalizarModalidades(fonte) {
  if (Array.isArray(fonte?.modalidades_trabalho) && fonte.modalidades_trabalho.length) {
    return fonte.modalidades_trabalho.filter((m) => OPCOES_MODALIDADE.includes(m));
  }

  switch (fonte?.remoto) {
    case "sim":
      return ["remoto"];
    case "nao":
      return ["presencial"];
    case "hibrido":
      return ["hibrido"];
    default:
      return ["remoto", "presencial", "hibrido"];
  }
}

export function preferenciasFromBusca(busca) {
  return {
    senioridades: normalizarSenioridades(busca),
    modalidades_trabalho: normalizarModalidades(busca),
    modo_busca: busca?.modo_busca ?? "focado",
    nota_minima: Number(busca?.nota_minima ?? busca?.nota_minima_candidatar ?? 4) || 4,
  };
}

/** @deprecated use preferenciasFromBusca */
export function preferenciasBuscaFromProfile(profile) {
  return preferenciasFromBusca(profile);
}

export function labelsSenioridades(slugs) {
  const lista = slugs ?? [];
  if (!lista.length) return "—";
  return lista.map(labelSenioridade).join(", ");
}

export function expandirAlvosCandidatura(alvos, senioridades) {
  const niveis = senioridades?.length ? senioridades : ["estagio"];
  const expandidos = [];

  for (const alvo of alvos ?? []) {
    for (const slug of niveis) {
      if (!combinacaoSenioridadeTituloValida(slug, alvo.titulo)) continue;
      expandidos.push({
        ...alvo,
        senioridade: slug,
        senioridadeLabel: labelSenioridade(slug),
        chaveComposta: `${slug}::${alvo.chave}`,
      });
    }
  }

  return expandidos;
}

export function contarAlvosExpandidos(totalCargos, senioridades) {
  const n = senioridades?.length ?? 0;
  if (!totalCargos || !n) return 0;
  return totalCargos * n;
}

export function buscaIgual(a, b) {
  const sort = (arr) => [...(arr ?? [])].sort();
  return (
    JSON.stringify(sort(a?.segmentos_ativos)) === JSON.stringify(sort(b?.segmentos_ativos)) &&
    JSON.stringify(sort(a?.titulos_ativos)) === JSON.stringify(sort(b?.titulos_ativos)) &&
    JSON.stringify(sort(a?.senioridades)) === JSON.stringify(sort(b?.senioridades)) &&
    JSON.stringify(sort(a?.modalidades_trabalho)) === JSON.stringify(sort(b?.modalidades_trabalho)) &&
    a?.modo_busca === b?.modo_busca &&
    Number(a?.nota_minima) === Number(b?.nota_minima)
  );
}
