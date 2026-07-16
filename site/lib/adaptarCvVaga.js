import fs from "fs";
import path from "path";
import { getCvBase, getProfile } from "@/lib/dados";
import { criarOuAtualizarSegmentacaoVaga, getSegmentacaoConteudo, getSegmentacaoSlot, salvarSegmentacaoPdf, statusPdfSegmentacao } from "@/lib/segmentacoes";
import { adaptarCvParaVaga } from "@/lib/adaptarCvLocal";
import {
  getPerfil,
  inferirPerfilPorVaga,
  resolverPerfilSlug,
  scoreSegmentosPorVaga,
} from "@/lib/perfilCvSegmento";
import { getFonteCandidato, montarContextoFonteParaPrompt } from "@/lib/fonteCandidato";
import { gerarPdfFromMarkdown } from "@/lib/gerarPdf";
import { LABELS_SEGMENTO, SEGMENTOS_CV_SLOTS } from "@/lib/conteudoConstants";
import { segmentoEstaAtivo } from "@/lib/segmentosAtivos";
import {
  metaPortalParaResposta,
  resolverPortalVagaInput,
} from "@/lib/portaisCatalogo";

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

export function montarPedidoVaga({ vaga_titulo, vaga_descricao, vaga_url }) {
  const descricao = String(vaga_descricao ?? "").trim();
  const url = String(vaga_url ?? "").trim();
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
    ...(url ? { vaga_url: url } : {}),
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
- Escrever em **1ª pessoa** — o candidato é o autor do CV; nunca \`Candidato a…\` nem 3ª pessoa.
- **Nunca** colocar instruções internas no markdown (paths, \`banco.yml\`, “destaque projetos…”, comentários HTML).
- Consultar perfil, tecnologias, conteúdo, formação e resultados antes de escrever.
- Espelhar termos da vaga; reordenar e enfatizar o que aderir — sem seção **Destaques** (usar Experiência e Projetos).
- Manter markdown com as mesmas seções das variações (Resumo, Competências, Experiência, Projetos, Formação, Certificações).

${contexto}

## Entrega
Markdown completo do CV adaptado, pronto para revisão.
`;
}

function resolverSegmentoEscolhido(input, pedido, fonte) {
  const raw = String(input?.segmento_slug ?? "").trim();
  if (raw && SEGMENTOS_CV_SLOTS.includes(raw)) {
    return resolverPerfilSlug(raw);
  }
  return inferirPerfilPorVaga(pedido.vaga_titulo, pedido.vaga_descricao, fonte);
}

/** Classifica a vaga e lista os 5 segmentos com score — sem gerar CV. */
export function classificarVaga(input) {
  const fonte = getFonteCandidato();
  const vaga_titulo = String(input?.vaga_titulo ?? "").trim();
  const vaga_descricao = String(input?.vaga_descricao ?? "").trim();
  const vaga_url = String(input?.vaga_url ?? "").trim();
  const portal = resolverPortalVagaInput({ ...input, vaga_url });
  const portalMeta = metaPortalParaResposta(portal);

  if (vaga_descricao.length < 20) {
    return { status: "erro", motivo: "descricao_curta" };
  }

  const titulo = tituloFromVaga(vaga_titulo, vaga_descricao);
  const scoresRanked = scoreSegmentosPorVaga(titulo, vaga_descricao, fonte);
  const scorePorSlug = new Map(scoresRanked.map((s) => [s.slug, s.score]));
  const segmento_slug = inferirPerfilPorVaga(titulo, vaga_descricao, fonte);
  const perfil = getPerfil(segmento_slug);

  const segmentos = SEGMENTOS_CV_SLOTS.map((slug) => {
    const canon = resolverPerfilSlug(slug);
    const score = scorePorSlug.get(canon) ?? scorePorSlug.get(slug) ?? 0;
    return {
      slug,
      label: LABELS_SEGMENTO[slug] ?? getPerfil(slug).label ?? slug,
      ativo: segmentoEstaAtivo(slug),
      score,
      sugerido: slug === segmento_slug,
    };
  }).sort((a, b) => b.score - a.score);

  return {
    status: "ok",
    vaga_titulo: titulo,
    vaga_url: vaga_url || null,
    ...portalMeta,
    segmento_slug,
    segmento_label: perfil.label ?? LABELS_SEGMENTO[segmento_slug] ?? segmento_slug,
    segmentos,
    scores: scoresRanked,
  };
}

export async function executarAdaptacaoCvVaga(input) {
  const fonte = getFonteCandidato();
  const pedido = montarPedidoVaga(input);
  const vaga_url = String(input?.vaga_url ?? pedido.vaga_url ?? "").trim();
  const portal = resolverPortalVagaInput({ ...input, vaga_url });
  const segmento_slug = resolverSegmentoEscolhido(input, pedido, fonte);
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

  const segmentacao = criarOuAtualizarSegmentacaoVaga({
    vaga_titulo: pedido.vaga_titulo,
    vaga_empresa: String(input?.vaga_empresa ?? "").trim() || null,
    vaga_descricao: pedido.vaga_descricao,
    vaga_url: vaga_url || null,
    segmento_slug,
    portal: portal || null,
    formato_cv: "ats",
    conteudoMd: conteudo,
  });

  return {
    status: "concluido",
    segmentacao,
    pedido,
    segmento_slug,
    portal: portal || null,
    vaga_url: vaga_url || null,
    vaga_titulo: pedido.vaga_titulo,
    vaga_empresa: String(input?.vaga_empresa ?? "").trim() || null,
    base: slot ? "slot" : "cv-base",
    motor: "local",
  };
}

export async function gerarPdfParaSegmentacao(id) {
  const conteudo = getSegmentacaoConteudo(id);
  if (!conteudo || conteudo.formato !== "markdown") {
    throw new Error("Variação sem markdown para gerar PDF");
  }

  const buffer = await gerarPdfFromMarkdown(conteudo.content);
  salvarSegmentacaoPdf(id, buffer);
  const pdfStatus = statusPdfSegmentacao(id);

  return {
    temPdf: pdfStatus.temPdf,
    pdfUrl: `/api/curriculo/segmentacoes/${id}/arquivo?v=${encodeURIComponent(pdfStatus.pdfUpdatedAt)}`,
    pdfUpdatedAt: pdfStatus.pdfUpdatedAt,
  };
}

/** Adapta CV para a vaga, opcionalmente gera PDF — uso da extensão e da aba Vaga. */
export async function executarPacoteCvVaga(input, { gerarPdf = true } = {}) {
  const fonte = getFonteCandidato();
  const descricao = String(input?.vaga_descricao ?? "").trim();

  if (descricao.length < 20) {
    return { status: "erro", motivo: "descricao_curta" };
  }

  const scores = scoreSegmentosPorVaga(input?.vaga_titulo, descricao, fonte);
  const adaptacao = await executarAdaptacaoCvVaga(input);

  if (adaptacao.status !== "concluido") {
    return { ...adaptacao, scores };
  }

  const perfil = getPerfil(adaptacao.segmento_slug);
  let pdf = null;

  if (gerarPdf) {
    try {
      pdf = await gerarPdfParaSegmentacao(adaptacao.segmentacao.id);
    } catch (err) {
      pdf = {
        temPdf: false,
        erro: err.message ?? "Falha ao gerar PDF",
        pdfUrl: null,
      };
    }
  }

  return {
    ...adaptacao,
    scores,
    segmento_label: perfil.label ?? LABELS_SEGMENTO[adaptacao.segmento_slug],
    pdf,
    // md ok + pdf falhou ainda é concluído — UI deve avisar
    aviso_pdf: pdf?.erro || null,
  };
}
