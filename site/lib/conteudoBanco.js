/**
 * Consultas ao banco de conteúdo (dados/conteudo/banco.yml) para montar CVs.
 */

import { getConteudoBanco } from "./dados.js";
import { certificacoesFallbackSegmento } from "./certificacoesBr.js";
import { competenciasPerfil } from "./perfilCvSegmento.js";
import { segmentoEstaAtivo } from "./segmentosAtivos.js";
import { getFonteCandidato, termosParaSegmento } from "./fonteCandidato.js";

export { LABELS_SEGMENTO, slugParaLabel } from "./conteudoConstants.js";

export function loadBanco() {
  return getConteudoBanco();
}

/** Texto do bullet para um segmento (reframe opcional por área). */
export function textoBulletParaSegmento(bullet, slug) {
  return bullet?.texto_por_segmento?.[slug]?.trim() || bullet?.texto?.trim() || "";
}

function segmentoAtivo(item, slug) {
  if (!segmentoEstaAtivo(slug)) return false;
  return (item?.segmentos ?? []).includes(slug);
}

export function experienciaParaSegmento(banco, slug) {
  const exp = (banco?.experiencias ?? []).find((e) => segmentoAtivo(e, slug));
  if (!exp) return null;

  const titulo = exp.titulo_por_segmento?.[slug] ?? `${exp.empresa}`;
  const nota = exp.nota_por_segmento?.[slug] ?? "";
  const bullets = (exp.bullets ?? [])
    .filter((b) => (b.segmentos ?? []).includes(slug))
    .map((b) => textoBulletParaSegmento(b, slug))
    .filter(Boolean);

  return {
    titulo,
    empresa: exp.empresa ?? "",
    nota,
    periodo: exp.periodo,
    local: exp.local,
    bullets,
  };
}

export function projetosParaSegmento(banco, slug, fallbackOrdem = []) {
  const lista = (banco?.projetos ?? []).filter((p) => segmentoAtivo(p, slug));

  if (!lista.length && fallbackOrdem.length) {
    return fallbackOrdem.map((nome, i) => ({
      nome,
      ordem: i + 1,
      subtitulo: "",
      stack: "",
      bullets: [],
    }));
  }

  return lista
    .map((p) => ({
      nome: p.nome,
      ordem: p.ordem_por_segmento?.[slug] ?? 99,
      resumo: p.resumo_por_segmento?.[slug] ?? p.subtitulo_por_segmento?.[slug] ?? "",
      stackUso: normalizarStackUso(
        p.stack_uso_por_segmento?.[slug],
        p.stack_por_segmento?.[slug],
      ),
      bullets: p.bullets_por_segmento?.[slug] ?? [],
    }))
    .sort((a, b) => a.ordem - b.ordem);
}

function normalizarStackUso(stackUso, stackLegado) {
  if (Array.isArray(stackUso) && stackUso.length) return stackUso;

  if (typeof stackLegado === "string" && stackLegado.trim()) {
    return stackLegado.split(",").map((tech) => ({ tech: tech.trim(), uso: "" }));
  }

  return [];
}

function formatarLinhaStackUso(item) {
  if (typeof item === "string") {
    const separador = item.includes(" — ") ? " — " : item.includes(" - ") ? " - " : null;
    if (separador) {
      const [tech, ...resto] = item.split(separador);
      const uso = resto.join(separador).trim();
      return uso ? `- **${tech.trim()}** — ${uso}` : `- **${tech.trim()}**`;
    }
    return `- **${item.trim()}**`;
  }

  const tech = String(item?.tech ?? item?.nome ?? "").trim();
  const uso = String(item?.uso ?? "").trim();
  if (!tech) return "";
  return uso ? `- **${tech}** — ${uso}` : `- **${tech}**`;
}

export function formatarBlocoProjeto(proj) {
  const titulo = proj.resumo?.trim() ? `${proj.nome} — ${proj.resumo.trim()}` : proj.nome;
  const stackLinhas = (proj.stackUso ?? []).map(formatarLinhaStackUso).filter(Boolean);

  if (stackLinhas.length) {
    return `### ${titulo}\n\n${stackLinhas.join("\n")}`;
  }

  const bullets = (proj.bullets ?? []).map((b) => `- ${b}`).join("\n");
  return bullets ? `### ${titulo}\n\n${bullets}` : `### ${titulo}`;
}

export function cursosParaSegmento(banco, slug) {
  return certificacoesParaSegmento(banco, slug);
}

const PADROES_CURSO_INGLES = [
  /the complete/i,
  /understanding typescript/i,
  /mongodb & more/i,
  /complete digital marketing/i,
  /complete guide/i,
  /maximilian schwarz/i,
  /jonas schmedtmann/i,
  /rob percival/i,
];

function normalizarChaveCert(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function chaveCertTexto(texto) {
  const bruto = String(texto ?? "")
    .replace(/^-\s*/, "")
    .trim();
  let titulo = bruto.split(" — ")[0].trim();
  titulo = titulo.replace(/\s+bootcamp\s*$/i, "").trim();
  return normalizarChaveCert(titulo);
}

function cursoEhMercadoBr(curso) {
  const blob = `${curso.titulo} ${curso.instrutor} ${curso.plataforma}`;
  if (PADROES_CURSO_INGLES.some((re) => re.test(blob))) return false;

  const plataforma = String(curso.plataforma ?? "").toLowerCase();
  const instrutor = String(curso.instrutor ?? "").toLowerCase();
  if (
    /alura|dio|rocketseat|skillshop|m2up|hashtag|fiap|senac|microsoft learn|rd university|meta blueprint|google/.test(
      `${plataforma} ${instrutor}`,
    )
  ) {
    return true;
  }

  if (plataforma === "udemy") {
    return /para |análise|análise|desenvolvimento|dados|completo|básico|avançado|manipulação|certificação|power bi|postgresql|python|sql|google ads/i.test(
      curso.titulo ?? "",
    );
  }

  return /português|portugues|brasil|\bbr\b/i.test(blob);
}

function formatarLinhaCurso(curso) {
  const partes = [curso.titulo];
  if (curso.instrutor) partes.push(curso.instrutor);
  const sufixo = curso.plataforma ? ` (${curso.plataforma})` : "";
  return `- ${partes.join(" — ")}${sufixo}`;
}

/** Certificações do segmento — cursos pt-BR do banco + catálogo BR (sem duplicar). */
export function certificacoesParaSegmento(banco, slug, { max = 8 } = {}) {
  const linhas = [];
  const vistos = new Set();

  const doBanco = (banco?.cursos ?? [])
    .filter((c) => segmentoAtivo(c, slug))
    .filter(cursoEhMercadoBr)
    .sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));

  for (const curso of doBanco) {
    const linha = formatarLinhaCurso(curso);
    const chave = chaveCertTexto(curso.titulo);
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    linhas.push(linha);
  }

  for (const cert of certificacoesFallbackSegmento(slug)) {
    const chave = chaveCertTexto(cert);
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    linhas.push(`- ${cert}`);
  }

  return linhas.slice(0, max);
}

export function ferramentasParaSegmento(banco, slug) {
  return (banco?.ferramentas ?? []).filter((f) => segmentoAtivo(f, slug));
}

function agruparFerramentas(ferramentas) {
  const map = new Map();
  for (const f of ferramentas) {
    const cat = f.categoria?.trim() || "Ferramentas";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(f.nome);
  }
  return map;
}

function enriquecerComTecnologiasPerfil(body, slug, fonte) {
  const f = fonte ?? getFonteCandidato();
  const termos = termosParaSegmento(slug, f);
  if (!termos.length) return body;

  const lower = body.toLowerCase();
  const faltando = termos.filter((t) => !lower.includes(String(t).toLowerCase()));
  if (!faltando.length) return body;

  const niveis = (f.tecnologias?.comNivel ?? [])
    .filter((t) => faltando.some((x) => x.toLowerCase() === t.nome.toLowerCase()))
    .map((t) => t.nome);

  const semNivel = faltando.filter(
    (t) => !niveis.some((n) => n.toLowerCase().startsWith(t.toLowerCase())),
  );

  const extras = [...niveis, ...semNivel];
  if (!extras.length) return body;

  const linha = `- **Stack (perfil):** ${extras.join(", ")}`;
  if (body.includes("**Idiomas:**")) {
    return body.replace(/- \*\*Idiomas:\*\*/, `${linha}\n- **Idiomas:**`);
  }
  return `${body.trim()}\n${linha}`;
}

export function competenciasDoBanco(banco, slug, fonte = null) {
  const ferramentas = ferramentasParaSegmento(banco, slug);
  let body;

  if (ferramentas.length) {
    const grupos = agruparFerramentas(ferramentas);
    const lines = [...grupos.entries()].map(
      ([cat, nomes]) => `- **${cat}:** ${nomes.join(", ")}`,
    );
    lines.push("- **Idiomas:** Português (nativo), Inglês (avançado), Espanhol (básico)");
    body = lines.join("\n");
  } else {
    const texto = banco?.competencias?.[slug];
    body = texto?.trim() ? texto.trim() : competenciasPerfil({ slug });
  }

  return enriquecerComTecnologiasPerfil(body, slug, fonte);
}
