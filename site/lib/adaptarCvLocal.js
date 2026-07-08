/**
 * Adaptação local de cv-base.md — monta CV focado por segmento/vaga.
 */

import { slugsSegmentosAtivos } from "./segmentosAtivos.js";
import {
  buildResumoPerfil,
  getPerfil,
  inferirPerfilPorVaga,
  resolverPerfilSlug,
  termosCandidatoParaPerfil,
} from "./perfilCvSegmento.js";
import {
  certificacoesParaSegmento,
  competenciasDoBanco,
  experienciaParaSegmento,
  formatarBlocoProjeto,
  loadBanco,
  projetosParaSegmento,
} from "./conteudoBanco.js";
import {
  formatarContatoCv,
  formatarFormacaoCv,
  getFonteCandidato,
} from "./fonteCandidato.js";

function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function scoreTexto(texto, termos, peso = 1) {
  const lower = normalize(texto);
  let score = 0;
  for (const termo of termos) {
    if (lower.includes(normalize(termo))) score += peso;
  }
  return score;
}

function parseSections(raw) {
  const parts = raw.split(/^## /m);
  const preamble = parts[0]?.trim() ?? "";
  const sections = [];

  for (const part of parts.slice(1)) {
    const nl = part.indexOf("\n");
    sections.push({
      title: part.slice(0, nl).trim(),
      body: part.slice(nl + 1).trim(),
    });
  }

  return { preamble, sections };
}

function splitSubsections(body) {
  const chunks = body.split(/^### /m);
  if (chunks.length <= 1) return [{ title: null, body }];

  const intro = chunks[0]?.trim();
  const subs = chunks.slice(1).map((chunk) => {
    const nl = chunk.indexOf("\n");
    return { title: chunk.slice(0, nl).trim(), body: chunk.slice(nl + 1).trim() };
  });

  return intro ? [{ title: null, body: intro }, ...subs] : subs;
}

function extractBullets(text) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "));
}

function reorderBullets(bullets, termos, max = 5) {
  return [...bullets]
    .sort((a, b) => scoreTexto(b, termos, 2) - scoreTexto(a, termos, 2))
    .slice(0, max);
}


function montarProjetos(perfil, banco) {
  const projetos = projetosParaSegmento(banco, perfil.slug, perfil.projetosOrdem);
  return projetos.map((p) => formatarBlocoProjeto(p)).join("\n\n");
}

function termosEfetivos(perfil, ctx, fonte) {
  const base = [...perfil.termos, ...termosCandidatoParaPerfil(perfil.slug, fonte)];
  if (ctx.tipo !== "vaga") return [...new Set(base)];

  const extra = `${ctx.titulo ?? ""}\n${ctx.descricao ?? ""}`.toLowerCase();
  const palavras = extra
    .split(/[^\p{L}\p{N}+#.]+/u)
    .map((w) => w.trim())
    .filter((w) => w.length > 2);
  return [...new Set([...base, ...palavras])];
}

function montarExperiencia(perfil, banco, parsed, ctx, fonte) {
  const termos = termosEfetivos(perfil, ctx, fonte);
  const exp = experienciaParaSegmento(banco, perfil.slug);
  if (exp) {
    const periodo = exp.periodo
      ? `**Período:** ${exp.periodo}${exp.local ? ` · ${exp.local}` : ""}`
      : "";
    const bullets = reorderBullets(
      exp.bullets.map((b) => `- ${b}`),
      termos,
      5,
    );
    const nota = exp.nota ? `\n\n*${exp.nota}*` : "";
    return `### ${exp.titulo}\n\n${periodo}\n\n${bullets.join("\n")}${nota}`;
  }

  const sec = parsed.sections.find((s) => /experi/i.test(s.title));
  if (!sec) return "";

  const sub = splitSubsections(sec.body).find((s) => s.title);
  if (!sub) return sec.body;

  const bullets = reorderBullets(extractBullets(sub.body), termos, 5);
  const periodo =
    sub.body.match(/\*\*Período:\*\*[^\n]+/)?.[0] ??
    "**Período:** Fev/2025 – Set/2025 · São Paulo – SP";

  return `### ${perfil.expTitulo}\n\n${periodo}\n\n${bullets.join("\n")}\n\n*${perfil.expNota}*`;
}

function adaptarCabecalho(parsed, perfil, fonte) {
  const nome = fonte.profile?.nome?.trim()
    ? `# ${fonte.profile.nome.trim()}`
    : parsed.preamble.split("\n").find((l) => l.startsWith("# ")) ?? "# Candidato";

  const contato = formatarContatoCv(fonte.profile, parsed.preamble);

  return `${nome}

**Cargo-alvo:** ${perfil.cargoAlvo}  
${contato}`;
}

function resolverPerfilSlugAdaptacao(ctx, fonte) {
  if (ctx.tipo === "busca") {
    return resolverPerfilSlug(ctx.slug);
  }

  if (ctx.segmento_slug) {
    return resolverPerfilSlug(ctx.segmento_slug);
  }

  const inferido = resolverPerfilSlug(
    inferirPerfilPorVaga(ctx.titulo ?? "", ctx.descricao ?? "", fonte),
  );
  const ativos = slugsSegmentosAtivos().map(resolverPerfilSlug);
  if (!ativos.length) return inferido;
  if (ativos.includes(inferido)) return inferido;
  return resolverPerfilSlug(ativos[0]);
}

function adaptarInterno(cvBase, ctx) {
  const fonte = ctx.fonte ?? getFonteCandidato();
  const perfilSlug =
    ctx.tipo === "busca"
      ? resolverPerfilSlug(ctx.slug)
      : resolverPerfilSlugAdaptacao(ctx, fonte);

  const perfil = getPerfil(perfilSlug);
  const banco = fonte.banco ?? loadBanco();
  const parsed = parseSections(cvBase);
  const sections = [
    { title: "Resumo", body: buildResumoPerfil(perfil, { ...ctx, fonte }) },
  ];

  sections.push(
    { title: "Competências", body: competenciasDoBanco(banco, perfil.slug, fonte) },
    { title: "Experiência", body: montarExperiencia(perfil, banco, parsed, ctx, fonte) },
    { title: "Projetos", body: montarProjetos(perfil, banco) },
  );

  const formacaoMd = formatarFormacaoCv(fonte.formacao);
  if (formacaoMd) {
    sections.push({ title: "Formação", body: formacaoMd });
  } else {
    const formacao = parsed.sections.find((s) => /formação|formacao/i.test(s.title));
    if (formacao) sections.push({ title: "Formação", body: formacao.body });
  }

  const certs = certificacoesParaSegmento(banco, perfil.slug);
  sections.push({
    title: "Certificações",
    body: certs.length ? certs.join("\n") : "- —",
  });

  return rebuildCv({
    preamble: adaptarCabecalho(parsed, perfil, fonte),
    sections,
  });
}

function rebuildCv({ preamble, sections }) {
  const body = sections.map((s) => `## ${s.title}\n\n${s.body}`).join("\n\n");
  return `${preamble}\n\n${body}`.trim() + "\n";
}

export function adaptarCvParaBusca(cvBase, pedido) {
  const fonte = pedido.fonte ?? getFonteCandidato();
  return adaptarInterno(cvBase, {
    tipo: "busca",
    slug: pedido.segmento?.slug ?? "dados-bi-analytics",
    nome: pedido.segmento?.nome,
    primarios: pedido.alvos_primarios ?? pedido.alvos ?? [],
    complementares: pedido.alvos_complementares ?? [],
    fonte,
  });
}

export function adaptarCvParaVaga(cvBase, pedido) {
  const fonte = pedido.fonte ?? getFonteCandidato();
  const segmento_slug =
    pedido.segmento_slug ??
    inferirPerfilPorVaga(pedido.vaga_titulo, pedido.vaga_descricao, fonte);

  return adaptarInterno(cvBase, {
    tipo: "vaga",
    titulo: pedido.vaga_titulo,
    descricao: pedido.vaga_descricao,
    segmento_slug,
    fonte,
  });
}

export function markdownAdaptadoValido(texto) {
  const t = String(texto ?? "").trim();
  return t.length >= 400 && /## Resumo/m.test(t) && /## /m.test(t);
}

export function extrairMarkdownResposta(texto) {
  let t = String(texto ?? "").trim();
  const fence = t.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)```$/i);
  if (fence) t = fence[1].trim();
  return t;
}

export const MOTOR_CV_VERSAO = 6;
