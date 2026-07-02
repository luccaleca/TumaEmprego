/**
 * Adaptação local de cv-base.md — monta CV focado por segmento/vaga.
 */

import {
  buildResumoPerfil,
  getPerfil,
  inferirPerfilPorVaga,
  resolverPerfilSlug,
} from "./perfilCvSegmento.js";
import {
  cursosParaSegmento,
  experienciaParaSegmento,
  formatarBlocoProjeto,
  competenciasDoBanco,
  loadBanco,
  projetosParaSegmento,
} from "./conteudoBanco.js";

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

function montarExperiencia(perfil, banco, parsed) {
  const exp = experienciaParaSegmento(banco, perfil.slug);
  if (exp) {
    const periodo = exp.periodo
      ? `**Período:** ${exp.periodo}${exp.local ? ` · ${exp.local}` : ""}`
      : "";
    const bullets = reorderBullets(
      exp.bullets.map((b) => `- ${b}`),
      perfil.termos,
      5,
    );
    const nota = exp.nota ? `\n\n*${exp.nota}*` : "";
    return `### ${exp.titulo}\n\n${periodo}\n\n${bullets.join("\n")}${nota}`;
  }

  const sec = parsed.sections.find((s) => /experi/i.test(s.title));
  if (!sec) return "";

  const sub = splitSubsections(sec.body).find((s) => s.title);
  if (!sub) return sec.body;

  const bullets = reorderBullets(extractBullets(sub.body), perfil.termos, 5);
  const periodo =
    sub.body.match(/\*\*Período:\*\*[^\n]+/)?.[0] ??
    "**Período:** Fev/2025 – Set/2025 · São Paulo – SP";

  return `### ${perfil.expTitulo}\n\n${periodo}\n\n${bullets.join("\n")}\n\n*${perfil.expNota}*`;
}

function montarDestaques(perfil, banco, parsed) {
  const expBullets = extractBullets(montarExperiencia(perfil, banco, parsed));
  const projBullets = [];

  for (const proj of projetosParaSegmento(banco, perfil.slug, perfil.projetosOrdem).slice(0, 2)) {
    projBullets.push(...(proj.bullets ?? []).map((b) => `- ${b}`));
  }

  const all = reorderBullets([...projBullets, ...expBullets], perfil.termos, 5);
  return all.length ? all.join("\n") : null;
}

function adaptarCabecalho(preamble, perfil) {
  const lines = preamble.split("\n");
  const nome = lines.find((l) => l.startsWith("# ")) ?? "# Nome do Candidato";
  const contato = lines.find((l) => l.includes("@") && l.includes("linkedin")) ?? "";

  return `${nome}

> Versão adaptada para **${perfil.label}** — derivada do cv-base.

**Cargo-alvo:** ${perfil.cargoAlvo}  
${contato.replace(/^\*\*Cargo-alvo:\*\*[^\n]*\n?/, "").trim()}`;
}

function rebuildCv({ preamble, sections, headerComment }) {
  const body = sections.map((s) => `## ${s.title}\n\n${s.body}`).join("\n\n");
  return `${headerComment}\n\n${preamble}\n\n${body}`.trim() + "\n";
}

function adaptarInterno(cvBase, ctx) {
  const perfilSlug =
    ctx.tipo === "busca"
      ? resolverPerfilSlug(ctx.slug)
      : inferirPerfilPorVaga(ctx.titulo ?? "", ctx.descricao ?? "");

  const perfil = getPerfil(perfilSlug);
  const banco = loadBanco();
  const contextoLabel = ctx.tipo === "vaga" ? ctx.titulo : ctx.nome ?? perfil.label;
  const parsed = parseSections(cvBase);
  const headerComment = `<!-- Adaptado em ${new Date().toISOString()} — ${contextoLabel} — ${perfil.slug} -->`;

  const destaques = montarDestaques(perfil, banco, parsed);
  const sections = [
    { title: "Resumo", body: buildResumoPerfil(perfil, ctx) },
  ];

  if (destaques) {
    sections.push({ title: `Destaques — ${perfil.label}`, body: destaques });
  }

  sections.push(
    { title: "Competências", body: competenciasDoBanco(banco, perfil.slug) },
    { title: "Experiência", body: montarExperiencia(perfil, banco, parsed) },
    { title: "Projetos", body: montarProjetos(perfil, banco) },
  );

  const formacao = parsed.sections.find((s) => /formação|formacao/i.test(s.title));
  if (formacao) sections.push({ title: "Formação", body: formacao.body });

  const certs = cursosParaSegmento(banco, perfil.slug);
  sections.push({
    title: "Certificações",
    body: certs.length ? certs.join("\n") : perfil.certificacoes.map((c) => `- ${c}`).join("\n"),
  });

  return rebuildCv({
    preamble: adaptarCabecalho(parsed.preamble, perfil),
    sections,
    headerComment,
  });
}

export function adaptarCvParaBusca(cvBase, pedido) {
  return adaptarInterno(cvBase, {
    tipo: "busca",
    slug: pedido.segmento?.slug ?? "dados-bi-analytics",
    nome: pedido.segmento?.nome,
    primarios: pedido.alvos_primarios ?? pedido.alvos ?? [],
    complementares: pedido.alvos_complementares ?? [],
  });
}

export function adaptarCvParaVaga(cvBase, pedido) {
  return adaptarInterno(cvBase, {
    tipo: "vaga",
    titulo: pedido.vaga_titulo,
    descricao: pedido.vaga_descricao,
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
