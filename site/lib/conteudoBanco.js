/**
 * Lê o banco de conteúdo pra montar o CV.
 */

import { getConteudoBanco } from "./dados.js";
import { certificacoesFallbackSegmento } from "./certificacoesBr.js";
import { competenciasPerfil } from "./perfilCvSegmento.js";
import { segmentoEstaAtivo } from "./segmentosAtivos.js";
import { getFonteCandidato, termosParaSegmento } from "./fonteCandidato.js";

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
  let bullets = (exp.bullets ?? [])
    .filter((b) => (b.segmentos ?? []).includes(slug))
    .map((b) => textoBulletParaSegmento(b, slug))
    .filter(Boolean);

  // IA no emprego: reforça com provas de dados da mesma empresa (sem inventar LLM)
  if (slug === "ia-ml" && bullets.length < 3) {
    const extra = (exp.bullets ?? [])
      .filter((b) => (b.segmentos ?? []).includes("dados-bi-analytics"))
      .map((b) => textoBulletParaSegmento(b, "dados-bi-analytics"))
      .filter(Boolean);
    const vistos = new Set(bullets.map((t) => t.slice(0, 40).toLowerCase()));
    for (const t of extra) {
      const k = t.slice(0, 40).toLowerCase();
      if (vistos.has(k)) continue;
      bullets.push(t);
      vistos.add(k);
      if (bullets.length >= 4) break;
    }
  }

  return {
    titulo,
    empresa: exp.empresa ?? "",
    nota,
    periodo: exp.periodo,
    local: exp.local,
    bullets,
  };
}

/** Hub de candidaturas — nunca no CV (recrutador não precisa saber). */
function projetoForaDoCv(p) {
  const id = String(p?.id ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  const nome = String(p?.nome ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  return /tuma.?emprego/.test(id) || /tuma.?emprego/.test(nome);
}

/** Projetos-produto de IA — prioridade em segmento ia-ml / JD de agentes. */
function bonusProjetoIa(nome, slug, enfatizaIa) {
  if (slug !== "ia-ml" && !enfatizaIa) return 0;
  const n = String(nome ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (/tuma.?emprego/.test(n)) return -100;
  if (/tumacore|tuma.?core/.test(n)) return 50;
  if (/tumaia|tuma.?ia/.test(n)) return 45;
  return 0;
}

export function projetosParaSegmento(
  banco,
  slug,
  fallbackOrdem = [],
  { termos = [], enfatizaProjetosIa = false } = {},
) {
  const lista = (banco?.projetos ?? [])
    .filter((p) => !projetoForaDoCv(p))
    .filter((p) => segmentoAtivo(p, slug));

  if (!lista.length && fallbackOrdem.length) {
    return fallbackOrdem
      .filter((nome) => !/tuma.?emprego/i.test(String(nome ?? "")))
      .map((nome, i) => ({
        nome,
        ordem: i + 1,
        subtitulo: "",
        stack: "",
        bullets: [],
      }));
  }

  const tNorm = termos.map((t) =>
    String(t ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, ""),
  );
  const enfatizaIa = Boolean(enfatizaProjetosIa) || slug === "ia-ml";

  return lista
    .map((p) => {
      const resumo = p.resumo_por_segmento?.[slug] ?? p.subtitulo_por_segmento?.[slug] ?? "";
      const stackUso = normalizarStackUso(
        p.stack_uso_por_segmento?.[slug],
        p.stack_por_segmento?.[slug],
      );
      const bullets = p.bullets_por_segmento?.[slug] ?? [];
      const blob = `${p.nome} ${resumo} ${JSON.stringify(stackUso)} ${bullets.join(" ")}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, "");
      const scoreJd =
        tNorm.reduce((n, t) => n + (t && blob.includes(t) ? 3 : 0), 0) +
        bonusProjetoIa(p.nome, slug, enfatizaIa);
      return {
        nome: p.nome,
        ordem: p.ordem_por_segmento?.[slug] ?? 99,
        resumo,
        stackUso,
        bullets,
        scoreJd,
      };
    })
    .sort((a, b) => b.scoreJd - a.scoreJd || a.ordem - b.ordem);
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
  if (!tech || !uso) return "";
  return `- **${tech}** — ${uso}`;
}

export function formatarBlocoProjeto(proj) {
  const titulo = proj.resumo?.trim() ? `${proj.nome} — ${proj.resumo.trim()}` : proj.nome;
  const stackLinhas = (proj.stackUso ?? [])
    .map(formatarLinhaStackUso)
    .filter(Boolean)
    .slice(0, 6);

  // Regra: tech + uso. Se houver stack_uso, nunca cair em bullets genéricos.
  if (stackLinhas.length) {
    return `### ${titulo}\n\n${stackLinhas.join("\n")}`;
  }

  const bullets = (proj.bullets ?? [])
    .map((b) => {
      const t = String(b ?? "").trim();
      if (!t) return "";
      // Tenta converter "Tech — uso" solto em formato padrão
      if (!t.startsWith("- ") && (t.includes(" — ") || t.includes(" - "))) {
        return formatarLinhaStackUso(t);
      }
      return t.startsWith("- ") ? t : `- ${t}`;
    })
    .filter(Boolean)
    .slice(0, 6);

  return bullets.length ? `### ${titulo}\n\n${bullets.join("\n")}` : `### ${titulo}`;
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
export function cursosDoBancoParaSegmento(banco, slug, { max = 8 } = {}) {
  return (banco?.cursos ?? [])
    .filter((c) => segmentoAtivo(c, slug))
    .filter(cursoEhMercadoBr)
    .sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99))
    .slice(0, max);
}

export function certificacoesParaSegmento(banco, slug, { max = 8, termosVaga = [] } = {}) {
  const linhas = [];
  const vistos = new Set();

  for (const curso of cursosDoBancoParaSegmento(banco, slug, { max: 99 })) {
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

  if (termosVaga?.length) {
    linhas.sort(
      (a, b) => scoreLinhaCompetencia(b, termosVaga) - scoreLinhaCompetencia(a, termosVaga),
    );
  }

  return linhas.slice(0, max);
}

export function ferramentasParaSegmento(_banco, slug, fonte = null) {
  const f = fonte ?? getFonteCandidato();
  return (f.tecnologias?.comNivel ?? [])
    .filter((t) => {
      const seg = t.segmentosCv ?? [];
      return seg.length && seg.includes(slug);
    })
    .map((t) => ({ nome: t.nome, categoria: t.categoria }));
}

function agruparFerramentas(ferramentas) {
  const map = new Map();
  for (const f of ferramentas) {
    const cat = f.categoria?.trim() || "Ferramentas";
    if (!map.has(cat)) map.set(cat, []);
    const nomes = map.get(cat);
    const nome = String(f.nome ?? "").trim();
    if (!nome) continue;
    if (nomes.some((n) => n.toLowerCase() === nome.toLowerCase())) continue;
    nomes.push(nome);
  }
  return map;
}

function scoreLinhaCompetencia(linha, termos) {
  const blob = String(linha ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  return termos.reduce((n, t) => {
    const tt = String(t ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
    return n + (tt && blob.includes(tt) ? 2 : 0);
  }, 0);
}

function reordenarCompetencias(body, termos = []) {
  if (!termos?.length) return body;
  const lines = String(body ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const idiomas = lines.filter((l) => /\*\*Idiomas:\*\*/i.test(l));
  const resto = lines.filter((l) => !/\*\*Idiomas:\*\*/i.test(l));
  resto.sort((a, b) => scoreLinhaCompetencia(b, termos) - scoreLinhaCompetencia(a, termos));
  return [...resto, ...idiomas].join("\n");
}

function enriquecerComTecnologiasPerfil(body, slug, fonte, evidencia = "") {
  const f = fonte ?? getFonteCandidato();
  const termos = termosParaSegmento(slug, f);
  if (!termos.length) return body;

  const lower = body.toLowerCase();
  const ev = String(evidencia ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  const faltando = termos.filter((t) => {
    const nome = String(t).toLowerCase();
    if (lower.includes(nome)) return false;
    // Só acrescenta se há evidência no restante do CV
    if (!ev) return false;
    const n = nome
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
    return ev.includes(n);
  });
  if (!faltando.length) return body;

  const niveis = (f.tecnologias?.comNivel ?? [])
    .filter((t) => faltando.some((x) => x.toLowerCase() === t.nome.toLowerCase()))
    .map((t) => t.nome);

  const semNivel = faltando.filter(
    (t) => !niveis.some((n) => n.toLowerCase().startsWith(t.toLowerCase())),
  );

  const extras = [...niveis, ...semNivel];
  if (!extras.length) return body;

  const linha = `- **Ferramentas:** ${extras.join(", ")}`;
  if (body.includes("**Idiomas:**")) {
    return body.replace(/- \*\*Idiomas:\*\*/, `${linha}\n- **Idiomas:**`);
  }
  return `${body.trim()}\n${linha}`;
}

/** Mantém só ferramentas citadas na evidência (exp/projetos/certs/stack do segmento). */
function filtrarLinhaCompetenciaPorEvidencia(linha, evidenciaNorm) {
  if (/\*\*Idiomas:\*\*/i.test(linha)) return linha;
  const m = linha.match(/^- \*\*([^*]+):\*\*\s*(.+)$/);
  if (!m) return linha;
  const cat = m[1].trim();
  const nomes = m[2]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ok = nomes.filter((nome) => {
    const n = nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
    if (!n) return false;
    if (evidenciaNorm.includes(n)) return true;
    // match parcial (ex.: "Google Ads" vs "Ads")
    const tokens = n.split(/\s+/).filter((t) => t.length > 2);
    return tokens.length > 0 && tokens.every((t) => evidenciaNorm.includes(t));
  });
  if (!ok.length) return null;
  return `- **${cat}:** ${ok.join(", ")}`;
}

/**
 * Une categorias esparsas (1 tech por linha) numa lista densa.
 * Regra: no máx. 2 linhas de ferramentas + idiomas — economiza 1ª página.
 */
function densificarCompetencias(body, termos = []) {
  const linhas = String(body ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const idiomas =
    linhas.find((l) => /\*\*Idiomas:\*\*/i.test(l)) ??
    "- **Idiomas:** Português (nativo), Inglês (avançado), Espanhol (básico)";
  const resto = linhas.filter((l) => !/\*\*Idiomas:\*\*/i.test(l));

  const nomes = [];
  for (const linha of resto) {
    const m = linha.match(/^- \*\*[^*]+:\*\*\s*(.+)$/);
    const raw = m ? m[1] : linha.replace(/^[-*]\s*/, "");
    for (const parte of raw.split(",")) {
      const nome = parte.trim();
      if (!nome) continue;
      if (nomes.some((n) => n.toLowerCase() === nome.toLowerCase())) continue;
      nomes.push(nome);
    }
  }

  if (!nomes.length) return idiomas;

  // Prioriza termos da vaga/segmento no início da lista
  const tNorm = (termos ?? []).map((t) =>
    String(t ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, ""),
  );
  nomes.sort((a, b) => {
    const an = a
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
    const bn = b
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
    const as = tNorm.some((t) => t && (an.includes(t) || t.includes(an))) ? 1 : 0;
    const bs = tNorm.some((t) => t && (bn.includes(t) || t.includes(bn))) ? 1 : 0;
    return bs - as;
  });

  const MAX_TOOLS = 10;
  const cortado = nomes.slice(0, MAX_TOOLS);

  // 1 linha se cabe; 2 só se passar de 7 (ainda denso)
  if (cortado.length <= 7) {
    return [`- **Ferramentas:** ${cortado.join(", ")}`, idiomas].join("\n");
  }
  const mid = Math.ceil(cortado.length / 2);
  return [
    `- **Ferramentas:** ${cortado.slice(0, mid).join(", ")}`,
    `- **Também:** ${cortado.slice(mid).join(", ")}`,
    idiomas,
  ].join("\n");
}

export function competenciasDoBanco(banco, slug, fonte = null, opts = {}) {
  const termosVaga = opts?.termosVaga ?? [];
  const evidencia = String(opts?.evidencia ?? "");
  const termosSegmento = opts?.termosSegmento ?? [];
  const ferramentas = ferramentasParaSegmento(banco, slug, fonte);
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

  body = enriquecerComTecnologiasPerfil(body, slug, fonte, evidencia);

  // Evidência = só o que está no CV desta variação (exp/projetos/certs/stack).
  // termos do segmento servem para ordenar, não para “provar” ferramenta órfã.
  const evidenciaNorm = String(evidencia)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

  if (evidenciaNorm.trim()) {
    body = String(body)
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => filtrarLinhaCompetenciaPorEvidencia(l, evidenciaNorm))
      .filter(Boolean)
      .join("\n");
  }

  const prioridade = [...termosVaga, ...termosSegmento];
  const ordenado = reordenarCompetencias(body, prioridade);
  const denso = densificarCompetencias(ordenado, prioridade);
  if (!/\*\*Ferramentas:\*\*|\*\*Também:\*\*/i.test(denso) && !/\*\*Idiomas:\*\*/i.test(denso)) {
    return densificarCompetencias(competenciasPerfil({ slug }), prioridade);
  }
  return denso;
}


