import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { getBusca, getCvBase, getProfile } from "@/lib/dados";
import { listarTitulosAtivos } from "@/lib/vagaCatalogo";
import { labelModalidades } from "@/lib/buscaOpcoes";
import {
  expandirAlvosCandidatura,
  labelsSenioridades,
  preferenciasFromBusca,
} from "@/lib/preferenciasBusca";
import {
  criarSegmentacaoFromPedido,
} from "@/lib/segmentacoes";

const DADOS_ROOT = path.join(process.cwd(), "..", "dados");
const REPO_ROOT = path.join(process.cwd(), "..");
const PEDIDO_PATH = path.join(DADOS_ROOT, "curriculo", "pedido-adaptacao.json");
const ADAPTADO_PATH = path.join(DADOS_ROOT, "curriculo", "adaptado-busca.md");
const PROMPT_PATH = path.join(DADOS_ROOT, "curriculo", "adaptacao-prompt.md");

export function getAdaptacaoBuscaPath() {
  return fs.existsSync(ADAPTADO_PATH) ? ADAPTADO_PATH : null;
}

export function getAdaptacaoBuscaConteudo() {
  if (!fs.existsSync(ADAPTADO_PATH)) return null;
  return fs.readFileSync(ADAPTADO_PATH, "utf8");
}

export function montarPedidoAdaptacao(busca, catalogo) {
  const preferencias = preferenciasFromBusca(busca);
  const alvos = listarTitulosAtivos(catalogo, busca.titulos_ativos ?? []);
  const alvosExpandidos = expandirAlvosCandidatura(alvos, preferencias.senioridades);

  let profile = {};
  try {
    profile = getProfile();
  } catch {
    profile = {};
  }

  return {
    criado_em: new Date().toISOString(),
    segmentos: busca.segmentos_ativos ?? [],
    preferencias,
    alvos: alvosExpandidos.map((a) => ({
      senioridade: a.senioridadeLabel,
      titulo: a.titulo,
      area: a.area,
      nicho: a.nicho,
    })),
    candidato: {
      nome: profile.nome ?? "",
      formacao: profile.nome ? undefined : "",
    },
  };
}

export function montarPromptAdaptacao(pedido) {
  const alvosLista = pedido.alvos
    .map((a) => `- ${a.senioridade} · ${a.titulo} (${a.area} → ${a.nicho})`)
    .join("\n");

  return `# Adaptação de CV — busca salva

Leia \`agente/AGENTS.md\` e \`dados/cv-base.md\`.

## Regras
- Não inventar experiência, ferramentas ou números.
- Adaptar ênfase do resumo, experiência e projetos para os alvos abaixo.
- Manter markdown compatível com cv-base (mesmas seções).
- Escrever o resultado completo no caminho indicado pela variável de ambiente SEG_OUTPUT_MD ou em \`dados/curriculo/adaptado-busca.md\`.

## Preferências
- Senioridades: ${labelsSenioridades(pedido.preferencias.senioridades)}
- Modalidade: ${labelModalidades(pedido.preferencias.modalidades_trabalho)}
- Modo: ${pedido.preferencias.modo_busca}
- Nota mínima: ${pedido.preferencias.nota_minima}

## Segmentos
${(pedido.segmentos ?? []).map((s) => `- ${s}`).join("\n")}

## Alvos de candidatura
${alvosLista || "- (nenhum cargo marcado)"}

## Entrega
Arquivo \`dados/curriculo/adaptado-busca.md\` com o CV adaptado (markdown), pronto para revisão e export PDF.
`;
}

function spawnAdaptacaoScript() {
  return new Promise((resolve) => {
    const scriptPath = path.join(REPO_ROOT, "scripts", "adaptar-cv-busca.mjs");
    if (!fs.existsSync(scriptPath)) {
      resolve({ ok: false, motivo: "script_ausente" });
      return;
    }

    const child = spawn(process.execPath, [scriptPath], {
      cwd: REPO_ROOT,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });

    child.on("close", (code) => {
      resolve({
        ok: code === 0,
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });
  });
}

export async function executarAdaptacaoCv(busca, catalogo) {
  const pedido = montarPedidoAdaptacao(busca, catalogo);
  fs.mkdirSync(path.dirname(PEDIDO_PATH), { recursive: true });
  fs.writeFileSync(PEDIDO_PATH, `${JSON.stringify(pedido, null, 2)}\n`, "utf8");

  const prompt = montarPromptAdaptacao(pedido);
  fs.writeFileSync(PROMPT_PATH, prompt, "utf8");

  if (!(busca.titulos_ativos ?? []).length) {
    return {
      status: "ignorado",
      motivo: "sem_cargos",
      pedidoPath: "dados/curriculo/pedido-adaptacao.json",
    };
  }

  if (!getCvBase()?.trim()) {
    return {
      status: "pendente",
      motivo: "sem_cv_base",
      pedidoPath: "dados/curriculo/pedido-adaptacao.json",
      promptPath: "dados/curriculo/adaptacao-prompt.md",
    };
  }

  const resultado = await spawnAdaptacaoScript();

  if (resultado.ok && fs.existsSync(ADAPTADO_PATH)) {
    const conteudo = fs.readFileSync(ADAPTADO_PATH, "utf8");
    const segmentacao = criarSegmentacaoFromPedido(pedido, conteudo);
    fs.unlinkSync(ADAPTADO_PATH);

    return {
      status: "concluido",
      segmentacao,
      pedidoPath: "dados/curriculo/pedido-adaptacao.json",
    };
  }

  if (process.env.CURSOR_API_KEY) {
    return {
      status: "erro",
      motivo: resultado.stderr || "adaptacao_falhou",
      pedidoPath: "dados/curriculo/pedido-adaptacao.json",
    };
  }

  return {
    status: "pendente",
    motivo: "sem_cursor_api_key",
    pedidoPath: "dados/curriculo/pedido-adaptacao.json",
    promptPath: "dados/curriculo/adaptacao-prompt.md",
    instrucao:
      "Defina CURSOR_API_KEY em site/.env ou rode no chat: adapte o CV usando dados/curriculo/adaptacao-prompt.md",
  };
}

export async function adaptarAposSalvarBusca(buscaSalva, catalogo) {
  return executarAdaptacaoCv(buscaSalva ?? getBusca(), catalogo);
}
