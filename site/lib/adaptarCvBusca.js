import fs from "fs";
import path from "path";
import { getBusca, getCvBase, getProfile } from "@/lib/dados";
import { listarTitulosAtivos } from "@/lib/vagaCatalogo";
import { labelModalidades } from "@/lib/buscaOpcoes";
import {
  expandirAlvosCandidatura,
  labelsSenioridades,
  preferenciasFromBusca,
} from "@/lib/preferenciasBusca";
import { areaSlugFromChave } from "@/lib/alvosSegmento";
import { criarSegmentacaoFromPedido } from "@/lib/segmentacoes";
import { adaptarCvParaBusca } from "@/lib/adaptarCvLocal";

const DADOS_ROOT = path.join(process.cwd(), "..", "dados");
const PEDIDO_PATH = path.join(DADOS_ROOT, "curriculo", "pedido-adaptacao.json");
const PROMPT_PATH = path.join(DADOS_ROOT, "curriculo", "adaptacao-prompt.md");
const ADAPTADO_PATH = path.join(DADOS_ROOT, "curriculo", "adaptado-busca.md");

function mapAlvosExpandidos(alvos, senioridades) {
  return expandirAlvosCandidatura(alvos, senioridades).map((a) => ({
    senioridade: a.senioridadeLabel,
    titulo: a.titulo,
    area: a.area,
    nicho: a.nicho,
    chave: a.chave,
  }));
}

export function montarPedidosAdaptacao(busca, catalogo) {
  const preferencias = preferenciasFromBusca(busca);
  const todos = listarTitulosAtivos(catalogo, busca.titulos_ativos ?? []);

  let profile = {};
  try {
    profile = getProfile();
  } catch {
    profile = {};
  }

  return (busca.segmentos_ativos ?? []).map((slug) => {
    const area = (catalogo ?? []).find((a) => a.slug === slug);
    const primarios = todos.filter((t) => areaSlugFromChave(t.chave) === slug);
    const complementares = todos.filter((t) => areaSlugFromChave(t.chave) !== slug);

    return {
      criado_em: new Date().toISOString(),
      segmento: {
        slug,
        nome: area?.nome ?? slug,
      },
      preferencias,
      alvos_primarios: mapAlvosExpandidos(primarios, preferencias.senioridades),
      alvos_complementares: mapAlvosExpandidos(complementares, preferencias.senioridades),
      candidato: {
        nome: profile.nome ?? "",
      },
    };
  });
}

/** @deprecated use montarPedidosAdaptacao */
export function montarPedidoAdaptacao(busca, catalogo) {
  const pedidos = montarPedidosAdaptacao(busca, catalogo);
  if (!pedidos.length) return null;
  const p = pedidos[0];
  return {
    ...p,
    segmentos: busca.segmentos_ativos ?? [],
    alvos: [...p.alvos_primarios, ...p.alvos_complementares],
  };
}

function formatarListaAlvos(alvos) {
  return (alvos ?? [])
    .map((a) => `- ${a.senioridade} · ${a.titulo} (${a.area} → ${a.nicho})`)
    .join("\n");
}

export function montarPromptAdaptacao(pedido) {
  return `# Adaptação de CV — ${pedido.segmento.nome}

Leia \`agente/AGENTS.md\` e \`dados/cv-base.md\`.

## Regras
- Não inventar experiência, ferramentas ou números.
- **Foco principal:** segmento "${pedido.segmento.nome}" e alvos principais abaixo.
- **Complemento:** mencionar alvos de outros segmentos como habilidade extra, sem roubar o foco.
- Manter markdown compatível com cv-base (mesmas seções).
- Escrever o resultado completo em markdown na resposta (não em arquivo).

## Preferências
- Senioridades: ${labelsSenioridades(pedido.preferencias.senioridades)}
- Modalidade: ${labelModalidades(pedido.preferencias.modalidades_trabalho)}
- Modo: ${pedido.preferencias.modo_busca}
- Nota mínima: ${pedido.preferencias.nota_minima}

## Alvos principais (ênfase no CV)
${formatarListaAlvos(pedido.alvos_primarios) || "- CV geral do segmento, sem cargo específico marcado"}

## Complemento (mencionar com leveza)
${formatarListaAlvos(pedido.alvos_complementares) || "- (nenhum)"}
`;
}

export async function executarAdaptacaoCv(busca, catalogo) {
  const pedidos = montarPedidosAdaptacao(busca, catalogo);
  fs.mkdirSync(path.dirname(PEDIDO_PATH), { recursive: true });
  fs.writeFileSync(PEDIDO_PATH, `${JSON.stringify({ pedidos }, null, 2)}\n`, "utf8");

  if (!pedidos.length) {
    return {
      status: "ignorado",
      motivo: "sem_segmentos_cv",
      pedidoPath: "dados/curriculo/pedido-adaptacao.json",
    };
  }

  const cvBase = getCvBase()?.trim();
  if (!cvBase) {
    fs.writeFileSync(PROMPT_PATH, montarPromptAdaptacao(pedidos[0]), "utf8");
    return {
      status: "pendente",
      motivo: "sem_cv_base",
      pedidoPath: "dados/curriculo/pedido-adaptacao.json",
      promptPath: "dados/curriculo/adaptacao-prompt.md",
    };
  }

  const segmentacoes = [];

  for (const pedido of pedidos) {
    fs.writeFileSync(PEDIDO_PATH, `${JSON.stringify(pedido, null, 2)}\n`, "utf8");
    const prompt = montarPromptAdaptacao(pedido);
    fs.writeFileSync(PROMPT_PATH, prompt, "utf8");

    const conteudo = adaptarCvParaBusca(cvBase, pedido);

    segmentacoes.push(criarSegmentacaoFromPedido(pedido, conteudo));
  }

  return {
    status: "concluido",
    segmentacoes,
    segmentacao: segmentacoes[0],
    pedidoPath: "dados/curriculo/pedido-adaptacao.json",
  };
}

export async function adaptarAposSalvarBusca(buscaSalva, catalogo) {
  return executarAdaptacaoCv(buscaSalva ?? getBusca(), catalogo);
}

export function getAdaptacaoBuscaPath() {
  return fs.existsSync(ADAPTADO_PATH) ? ADAPTADO_PATH : null;
}

export function getAdaptacaoBuscaConteudo() {
  if (!fs.existsSync(ADAPTADO_PATH)) return null;
  return fs.readFileSync(ADAPTADO_PATH, "utf8");
}
