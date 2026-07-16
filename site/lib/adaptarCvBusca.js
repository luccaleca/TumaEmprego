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
import { upsertSlotSegmentacao, migrarSegmentacoesParaSlots } from "@/lib/segmentacoes";
import { adaptarCvParaBusca } from "@/lib/adaptarCvLocal";
import { SEGMENTOS_CV_SLOTS } from "@/lib/conteudoConstants";
import { getFonteCandidato, montarContextoFonteParaPrompt } from "@/lib/fonteCandidato";

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

export function montarPedidoAdaptacaoPorSlug(busca, catalogo, slug) {
  const preferencias = preferenciasFromBusca(busca);
  const todos = listarTitulosAtivos(catalogo, busca.titulos_ativos ?? []);

  let profile = {};
  try {
    profile = getProfile();
  } catch {
    profile = {};
  }

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
}

export function montarPedidosAdaptacao(busca, catalogo) {
  return SEGMENTOS_CV_SLOTS.map((slug) => montarPedidoAdaptacaoPorSlug(busca, catalogo, slug));
}

function formatarListaAlvos(alvos) {
  return (alvos ?? [])
    .map((a) => `- ${a.senioridade} · ${a.titulo} (${a.area} → ${a.nicho})`)
    .join("\n");
}

export function montarPromptAdaptacao(pedido) {
  const fonte = getFonteCandidato();
  const contexto = montarContextoFonteParaPrompt(fonte, {
    segmentoSlug: pedido.segmento?.slug,
  });

  return `# Adaptação de CV — ${pedido.segmento.nome}

Leia \`agente/AGENTS.md\`.

## Regras
- Não inventar experiência, ferramentas ou números.
- Consultar perfil, tecnologias, conteúdo, formação e resultados (fonte abaixo).
- **Foco principal:** segmento "${pedido.segmento.nome}" e alvos principais abaixo.
- **Complemento:** mencionar alvos de outros segmentos como habilidade extra, sem roubar o foco.
- Manter markdown compatível com cv-base (mesmas seções).
- Escrever o resultado completo em markdown na resposta (não em arquivo).

${contexto}

## Preferências
- Senioridades: ${labelsSenioridades(pedido.preferencias.senioridades)}
- Modalidade: ${labelModalidades(pedido.preferencias.modalidades_trabalho)}
- Modo: ${pedido.preferencias.modo_busca}

## Alvos principais (ênfase no CV)
${formatarListaAlvos(pedido.alvos_primarios) || "- CV geral do segmento, sem cargo específico marcado"}

## Complemento (mencionar com leveza)
${formatarListaAlvos(pedido.alvos_complementares) || "- (nenhum)"}
`;
}

export async function executarAdaptacaoCv(busca, catalogo, { regenerar = false } = {}) {
  migrarSegmentacoesParaSlots();
  const pedidos = montarPedidosAdaptacao(busca, catalogo);
  fs.mkdirSync(path.dirname(PEDIDO_PATH), { recursive: true });
  fs.writeFileSync(PEDIDO_PATH, `${JSON.stringify({ pedidos }, null, 2)}\n`, "utf8");

  const cvBase = getCvBase()?.trim();
  if (!cvBase) {
    if (pedidos.length) {
      fs.writeFileSync(PROMPT_PATH, montarPromptAdaptacao(pedidos[0]), "utf8");
    }
    return {
      status: "pendente",
      motivo: "sem_cv_base",
      pedidoPath: "dados/curriculo/pedido-adaptacao.json",
      promptPath: "dados/curriculo/adaptacao-prompt.md",
    };
  }

  const segmentacoes = [];
  const ativos = new Set(busca.segmentos_ativos ?? []);

  for (const pedido of pedidos) {
    fs.writeFileSync(PEDIDO_PATH, `${JSON.stringify(pedido, null, 2)}\n`, "utf8");
    fs.writeFileSync(PROMPT_PATH, montarPromptAdaptacao(pedido), "utf8");

    const fonte = getFonteCandidato();
    const conteudo = adaptarCvParaBusca(cvBase, { ...pedido, fonte });
    const seg = upsertSlotSegmentacao(pedido, conteudo, { regenerar });
    segmentacoes.push(seg);
  }

  const visiveis = segmentacoes.filter((s) => ativos.has(s.segmento_slug));

  return {
    status: "concluido",
    segmentacoes,
    segmentacao: visiveis[0] ?? segmentacoes[0],
    slots_total: segmentacoes.length,
    slots_visiveis: visiveis.length,
    pedidoPath: "dados/curriculo/pedido-adaptacao.json",
  };
}

export async function sincronizarSlotsSegmento(busca, catalogo) {
  return executarAdaptacaoCv(busca, catalogo, { regenerar: false });
}

export async function adaptarAposSalvarBusca(buscaSalva, catalogo) {
  return executarAdaptacaoCv(buscaSalva ?? getBusca(), catalogo, { regenerar: false });
}
