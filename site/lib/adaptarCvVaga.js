import fs from "fs";
import path from "path";
import { getCvBase, getProfile } from "@/lib/dados";
import { criarSegmentacao, getSegmentacaoConteudo, getSegmentacaoSlot } from "@/lib/segmentacoes";
import { adaptarCvParaVaga } from "@/lib/adaptarCvLocal";
import { inferirPerfilPorVaga } from "@/lib/perfilCvSegmento";
import { getFonteCandidato, montarContextoFonteParaPrompt } from "@/lib/fonteCandidato";

const DADOS_ROOT = path.join(process.cwd(), "..", "dados");
const PEDIDO_PATH = path.join(DADOS_ROOT, "curriculo", "pedido-vaga.json");
const PROMPT_PATH = path.join(DADOS_ROOT, "curriculo", "adaptacao-vaga-prompt.md");
const FONTE_PATH = path.join(DADOS_ROOT, "curriculo", "adaptacao-vaga-fonte.md");

export function tituloFromVaga(vagaTitulo, vagaDescricao) {
  const titulo = String(vagaTitulo ?? "").trim();
  if (titulo) return titulo;

  const linhas = String(vagaDescricao ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const candidata = linhas.find((l) => l.length >= 8 && l.length <= 100);
  if (candidata) return candidata;

  return `Vaga · ${new Date().toLocaleDateString("pt-BR")}`;
}

export function montarPedidoVaga({ vaga_titulo, vaga_descricao }) {
  const descricao = String(vaga_descricao ?? "").trim();
  let profile = {};
  try {
    profile = getProfile();
  } catch {
    profile = {};
  }

  return {
    criado_em: new Date().toISOString(),
    vaga_titulo: tituloFromVaga(vaga_titulo, descricao),
    vaga_descricao: descricao,
    candidato: {
      nome: profile.nome ?? "",
    },
  };
}

export function montarPromptVaga(pedido, fonte) {
  const f = fonte ?? getFonteCandidato();
  const contexto = montarContextoFonteParaPrompt(f, {
    segmentoSlug: pedido.segmento_slug,
    vagaTitulo: pedido.vaga_titulo,
    vagaDescricao: pedido.vaga_descricao,
  });

  return `# Adaptação de CV — vaga específica

Leia \`agente/AGENTS.md\`.

## Objetivo
Montar um currículo **sob medida para esta vaga**, usando **apenas** os fatos listados na fonte abaixo e no cv-base / banco de conteúdo.

## Regras
- Não inventar experiência, ferramentas, certificações ou números.
- Consultar perfil, tecnologias, conteúdo, formação e resultados antes de escrever.
- Espelhar termos e prioridades da descrição da vaga (stack, responsabilidades, senioridade).
- Reordenar e enfatizar o que mais aderir à vaga; omitir ou encurtar o irrelevante.
- Manter markdown com as mesmas seções do cv-base.
- Escrever o resultado completo em markdown na resposta (não em arquivo).

${contexto}

## Entrega
Markdown completo do CV adaptado, pronto para revisão.
`;
}

export async function executarAdaptacaoCvVaga(input) {
  const fonte = getFonteCandidato();
  const pedido = montarPedidoVaga(input);
  const segmento_slug = inferirPerfilPorVaga(
    pedido.vaga_titulo,
    pedido.vaga_descricao,
    fonte,
  );
  pedido.segmento_slug = segmento_slug;

  fs.mkdirSync(path.dirname(PEDIDO_PATH), { recursive: true });
  fs.writeFileSync(PEDIDO_PATH, `${JSON.stringify(pedido, null, 2)}\n`, "utf8");

  const prompt = montarPromptVaga(pedido, fonte);
  fs.writeFileSync(PROMPT_PATH, prompt, "utf8");
  fs.writeFileSync(FONTE_PATH, montarContextoFonteParaPrompt(fonte, {
    segmentoSlug: segmento_slug,
    vagaTitulo: pedido.vaga_titulo,
    vagaDescricao: pedido.vaga_descricao,
  }), "utf8");

  if (!pedido.vaga_descricao) {
    return { status: "ignorado", motivo: "sem_descricao_vaga" };
  }

  const slot = getSegmentacaoSlot(segmento_slug);
  const slotMd = slot ? getSegmentacaoConteudo(slot.id)?.content : null;
  const cvBase = slotMd?.trim() || getCvBase()?.trim();

  if (!cvBase) {
    return {
      status: "pendente",
      motivo: "sem_cv_base",
      instrucao: "Envie ou edite o currículo base antes de gerar para a vaga.",
    };
  }

  const conteudo = adaptarCvParaVaga(cvBase, { ...pedido, fonte, segmento_slug });

  const segmentacao = criarSegmentacao({
    vaga_titulo: pedido.vaga_titulo,
    vaga_descricao: pedido.vaga_descricao,
    origem: "vaga",
    segmento_slug,
    conteudoMd: conteudo,
  });

  return {
    status: "concluido",
    segmentacao,
    pedido,
    segmento_slug,
    base: slot ? "slot" : "cv-base",
    motor: "local",
  };
}
