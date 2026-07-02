import fs from "fs";
import path from "path";
import { getCvBase, getProfile } from "@/lib/dados";
import { criarSegmentacao } from "@/lib/segmentacoes";
import { adaptarCvParaVaga } from "@/lib/adaptarCvLocal";

const DADOS_ROOT = path.join(process.cwd(), "..", "dados");
const PEDIDO_PATH = path.join(DADOS_ROOT, "curriculo", "pedido-vaga.json");
const PROMPT_PATH = path.join(DADOS_ROOT, "curriculo", "adaptacao-vaga-prompt.md");

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

export function montarPromptVaga(pedido) {
  return `# Adaptação de CV — vaga específica

Leia \`agente/AGENTS.md\` e \`dados/cv-base.md\`.

## Objetivo
Montar um currículo **sob medida para esta vaga**, usando apenas fatos do CV base.

## Regras
- Não inventar experiência, ferramentas, certificações ou números.
- Espelhar termos e prioridades da descrição da vaga (stack, responsabilidades, senioridade).
- Reordenar e enfatizar o que mais aderir à vaga; omitir ou encurtar o irrelevante.
- Manter markdown com as mesmas seções do cv-base.
- Escrever o resultado completo em markdown na resposta (não em arquivo).

## Vaga
**Título:** ${pedido.vaga_titulo}

## Descrição da vaga
${pedido.vaga_descricao}

## Entrega
Markdown completo do CV adaptado, pronto para revisão.
`;
}

export async function executarAdaptacaoCvVaga(input) {
  const pedido = montarPedidoVaga(input);
  fs.mkdirSync(path.dirname(PEDIDO_PATH), { recursive: true });
  fs.writeFileSync(PEDIDO_PATH, `${JSON.stringify(pedido, null, 2)}\n`, "utf8");
  const prompt = montarPromptVaga(pedido);
  fs.writeFileSync(PROMPT_PATH, prompt, "utf8");

  if (!pedido.vaga_descricao) {
    return { status: "ignorado", motivo: "sem_descricao_vaga" };
  }

  const cvBase = getCvBase()?.trim();
  if (!cvBase) {
    return {
      status: "pendente",
      motivo: "sem_cv_base",
      instrucao: "Envie ou edite o currículo base antes de gerar para a vaga.",
    };
  }

  const conteudo = adaptarCvParaVaga(cvBase, pedido);

  const segmentacao = criarSegmentacao({
    vaga_titulo: pedido.vaga_titulo,
    vaga_descricao: pedido.vaga_descricao,
    origem: "vaga",
    conteudoMd: conteudo,
  });

  return { status: "concluido", segmentacao, pedido, motor: "local" };
}
