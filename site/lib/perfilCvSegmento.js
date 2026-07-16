/**
 * Perfis de currículo por segmento/vaga — o motor local monta um CV focado por área.
 */

import { LABELS_SEGMENTO } from "./conteudoConstants.js";
import { slugsSegmentosAtivos } from "./segmentosAtivos.js";
import { getFonteCandidato, termosParaSegmento, termosTecnologiaCandidato } from "./fonteCandidato.js";
import { provaDeAtividade } from "./atividadesConteudo.js";
import { cargoAlvoNeutroDaVaga, normalizeTexto } from "./termosVaga.js";

export const PERFIS = {
  "dados-bi-analytics": {
    slug: "dados-bi-analytics",
    label: "Dados, BI e Analytics",
    cargoAlvo: "Estágio / Trainee em Análise de Dados, BI e Analytics",
    stack: "SQL · Python · Power BI · PostgreSQL · Pandas · Excel · Supabase",
    termos: [
      "sql", "python", "power bi", "dados", "analytics", "bi", "dashboard", "kpi",
      "postgresql", "supabase", "etl", "excel", "pandas", "modelagem",
    ],
    projetosOrdem: ["Projeto de Portfólio"],
    expTitulo: "Experiência profissional — Análise de Dados",
    resumoExp:
      "Tenho experiência com **SQL**, **Python** e **Power BI** — consultas, dashboards e análises que apoiaram decisões de negócio.",
  },

  desenvolvimento: {
    slug: "desenvolvimento",
    label: "Desenvolvimento de Software",
    cargoAlvo: "Estágio / Trainee em Desenvolvimento de Software (Web / Full Stack)",
    stack: "JavaScript · TypeScript · React · Next.js · Node.js · Express · PostgreSQL · Git",
    termos: [
      "javascript", "typescript", "react", "next.js", "nextjs", "node", "express", "api",
      "full stack", "front-end", "frontend", "back-end", "backend", "git", "html", "css",
      "postgresql", "prisma",
    ],
    projetosOrdem: ["Projeto de Portfólio"],
    expTitulo: "Experiência profissional — Desenvolvimento de Software",
    resumoExp:
      "Tenho experiência com **React**, **Next.js**, **Node.js** e **SQL** — interfaces, APIs e automações em ambiente real.",
  },

  "marketing-growth": {
    slug: "marketing-growth",
    label: "Marketing Digital / Growth",
    cargoAlvo: "Estágio / Trainee em Marketing Digital, Growth e Performance",
    stack: "Google Analytics 4 · Google Ads · Meta Ads · Power BI · SQL · Python · GTM",
    termos: [
      "marketing", "growth", "google ads", "meta ads", "analytics", "ga4", "gtm",
      "performance", "segmentação", "kpi", "power bi", "sql", "python", "shopify", "vtex",
    ],
    projetosOrdem: ["Projeto de Portfólio"],
    expTitulo: "Experiência profissional — Marketing / Growth",
    resumoExp:
      "Tenho experiência com **Google Ads**, **Meta Ads**, **SQL** e **Power BI** — campanhas, segmentação e leitura de performance.",
  },

  "ia-ml": {
    slug: "ia-ml",
    label: "Inteligência Artificial / ML",
    cargoAlvo: "Estágio / Trainee em IA, ML ou Engenharia de IA",
    stack: "Python · LLM · RAG · FastAPI · PostgreSQL · Next.js · Prompt engineering",
    termos: [
      "ia", "inteligência artificial", "machine learning", "llm", "rag", "python",
      "fastapi", "postgresql", "prompt", "gemini", "chroma",
    ],
    projetosOrdem: ["Projeto de Portfólio"],
    expTitulo: "Experiência profissional — Dados para Produto",
    resumoExp:
      "Montei base analítica com **SQL**, **Python** e ferramentas de BI para apoiar produto e operação.",
  },
};

const SLUG_ALIASES = {
  "engenharia-software": "desenvolvimento",
};

const TERMOS_MARKETING = [
  "marketing", "growth", "google ads", "meta ads", "tráfego", "trafego", "performance",
  "mídia", "midia", "crm", "social media", "instagram", "e-commerce", "ecommerce",
];

const TERMOS_IA = [
  "inteligência artificial", "inteligencia artificial", "machine learning", "llm",
  "engenharia de ia", " cientista", " ml ", " rag ", " prompt",
];

const TERMOS_DEV = [
  "desenvolvedor", "developer", "react", "next.js", "nextjs", "javascript", "typescript",
  "front-end", "frontend", "back-end", "backend", "full stack", "fullstack", "node",
  "programador", "software", " web ", "n8n", "automação", "automacao", "integração",
  "integracao", "fastapi", "webhook", "low-code", "low code", "api rest",
];

const TERMOS_DADOS = [
  "analista de dados", "data analyst", " bi ", "power bi", "sql", "analytics", "dados",
  "etl", "cientista de dados", "engenheiro de dados", "postgresql", "dashboard",
];

function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function scoreTermos(texto, lista) {
  const n = normalize(texto);
  return lista.filter((t) => n.includes(normalize(t))).length;
}

export function resolverPerfilSlug(slug) {
  return SLUG_ALIASES[slug] ?? slug;
}

function scoreSegmentoSlug(slug, texto, fonte) {
  const key = resolverPerfilSlug(slug);
  const perfil = PERFIS[key];
  if (!perfil) return 0;

  let score = 0;
  if (key === "marketing-growth") score += scoreTermos(texto, TERMOS_MARKETING) * 2;
  if (key === "ia-ml") score += scoreTermos(texto, TERMOS_IA) * 2;
  if (key === "desenvolvimento") score += scoreTermos(texto, TERMOS_DEV) * 2;
  if (key === "dados-bi-analytics") score += scoreTermos(texto, TERMOS_DADOS) * 2;

  for (const termo of termosParaSegmento(key, fonte)) {
    if (normalize(texto).includes(normalize(termo))) {
      score += 3;
    }
  }

  for (const termo of perfil.termos ?? []) {
    if (normalize(texto).includes(normalize(termo))) {
      score += 1;
    }
  }

  return score;
}

function slugsParaClassificar() {
  const ativos = slugsSegmentosAtivos().map(resolverPerfilSlug);
  const unicos = [...new Set(ativos)];
  if (unicos.length) return unicos;
  return Object.keys(PERFIS);
}

/** Ranking de segmentos para uma vaga (só segmentos ativos, se houver). */
export function scoreSegmentosPorVaga(titulo, descricao, fonte = null) {
  const f = fonte ?? getFonteCandidato();
  const texto = `${titulo}\n${descricao}`;
  const slugs = slugsParaClassificar();

  return slugs
    .map((slug) => ({
      slug,
      label: PERFIS[slug]?.label ?? LABELS_SEGMENTO[slug] ?? slug,
      score: scoreSegmentoSlug(slug, texto, f),
    }))
    .sort((a, b) => b.score - a.score);
}

export function inferirPerfilPorVaga(titulo, descricao, fonte = null) {
  const ranked = scoreSegmentosPorVaga(titulo, descricao, fonte);
  if (ranked[0]?.score > 0) return ranked[0].slug;

  const ativos = slugsSegmentosAtivos().map(resolverPerfilSlug);
  if (ativos.length) return resolverPerfilSlug(ativos[0]);
  return "dados-bi-analytics";
}

/** Termos do candidato (tecnologias + perfil) para reordenação de bullets. */
export function termosCandidatoParaPerfil(perfilSlug, fonte = null) {
  const f = fonte ?? getFonteCandidato();
  return [...new Set([...(termosParaSegmento(perfilSlug, f)), ...termosTecnologiaCandidato(f)])];
}

export function getPerfil(slug) {
  const key = resolverPerfilSlug(slug);
  return PERFIS[key] ?? PERFIS["dados-bi-analytics"];
}

/** Prova: IA → projetos; demais → atividades Ótica / lançamento / banco. */
function provaParaResumo(perfil, ctx) {
  const termos = [
    ...(ctx.termosVaga ?? []),
    ...String(ctx.titulo ?? "")
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2),
    ...String(ctx.descricao ?? "")
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3)
      .slice(0, 40),
  ];
  const indice = Number.isFinite(ctx.provaIndice) ? ctx.provaIndice : 0;
  const slug = perfil.slug;
  const tVaga = (ctx.termosVaga ?? []).map((t) => normalizeTexto(t)).filter(Boolean);

  const projetos = ctx.fonte?.banco?.projetos ?? [];
  const ranqueados = projetos
    .filter((p) => !/tuma.?emprego/i.test(`${p.id ?? ""} ${p.nome ?? ""}`))
    .filter((p) => !p.segmentos || p.segmentos.includes(slug))
    .map((p) => {
      const resumo =
        p.resumo_por_segmento?.[slug]?.trim() ||
        p.subtitulo_por_segmento?.[slug]?.trim() ||
        "";
      const blob = normalizeTexto(`${p.nome} ${resumo}`);
      const score = tVaga.reduce((n, t) => n + (blob.includes(t) ? 2 : 0), 0);
      return { p, resumo, score };
    })
    .sort((a, b) => b.score - a.score);

  // Em vaga: prova preferencialmente de projeto alinhado à JD
  if (ctx.tipo === "vaga" && ranqueados.length) {
    const item = ranqueados[indice] ?? ranqueados[0];
    if (item?.p?.nome && item.resumo) {
      return `No projeto **${item.p.nome}**, ${item.resumo}`;
    }
    if (item?.p?.nome) {
      return `Desenvolvi o projeto **${item.p.nome}** com foco em IA/LLM`;
    }
  }

  if (slug === "ia-ml" && ranqueados.length) {
    const item = ranqueados[indice] ?? ranqueados[0];
    if (item?.p?.nome) {
      return item.resumo
        ? `No projeto **${item.p.nome}**, ${item.resumo}`
        : `Desenvolvi o projeto **${item.p.nome}** com foco em IA/LLM`;
    }
  }

  const dePool = provaDeAtividade(slug, { termos, indice });
  if (dePool && !/prova principal|n[aã]o o est[aá]gio|banco\.yml/i.test(dePool)) {
    return dePool;
  }

  const exp = (ctx.fonte?.banco?.experiencias ?? []).find((e) =>
    (e.segmentos ?? []).includes(slug),
  );
  if (exp?.bullets?.length) {
    const bullet = exp.bullets.find((b) => (b.segmentos ?? []).includes(slug));
    const texto =
      bullet?.texto_por_segmento?.[slug]?.trim() || bullet?.texto?.trim() || "";
    if (texto && !/prova principal|n[aã]o o est[aá]gio/i.test(texto)) {
      return texto.replace(/\*\*/g, "");
    }
  }

  for (const item of ranqueados) {
    if (item.p.nome && item.resumo) return `No projeto **${item.p.nome}**, ${item.resumo}`;
    if (item.p.nome) return `Desenvolvi o projeto **${item.p.nome}**`;
  }

  return String(perfil.resumoExp ?? "").trim();
}

function stackCurtaParaResumo(perfil, ctx = null) {
  const base = String(perfil.stack ?? "")
    .split(/\s*·\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (ctx?.tipo !== "vaga" || !ctx?.termosVaga?.length) {
    return base.slice(0, 3).join(", ");
  }

  const tNorm = ctx.termosVaga.map((t) => normalizeTexto(t));
  const scored = base
    .map((tech) => {
      const n = normalizeTexto(tech);
      const hit = tNorm.some((t) => t && (n.includes(t) || t.includes(n)));
      return { tech, hit };
    })
    .sort((a, b) => Number(b.hit) - Number(a.hit));

  const picked = [];
  for (const item of scored) {
    if (picked.length >= 3) break;
    picked.push(item.tech);
  }
  return picked.join(", ");
}

/** Fallback se não houver formação no perfil. */
function fazBemParaSegmento(perfil, stack) {
  if (!stack) {
    const fallback = {
      "marketing-growth": "Atuo com mídia, growth e leitura de performance",
      "dados-bi-analytics": "Atuo com análise de dados, dashboards e decisão baseada em dados",
      desenvolvimento: "Atuo com produtos web e entregas de software",
      "ia-ml": "Atuo com produtos e fluxos com IA/LLM",
    };
    return fallback[perfil.slug] ?? `Atuo com entregas em ${perfil.label}`;
  }
  const map = {
    "marketing-growth": `Atuo com ${stack}, em mídia, growth e leitura de performance`,
    "dados-bi-analytics": `Atuo com ${stack}, em análises e decisão baseada em dados`,
    desenvolvimento: `Atuo com ${stack}, em produtos web e entregas de software`,
    "ia-ml": `Atuo com ${stack}, em produtos e fluxos com IA/LLM`,
  };
  return map[perfil.slug] ?? `Atuo com ${stack}, com foco em ${perfil.label}`;
}

/** Abertura natural — contexto estudo + stack (estilo CV feito à mão). */
function aberturaResumo(perfil, stack, ctx) {
  const formacao = ctx?.fonte?.formacao ?? {};
  const curso = String(formacao.curso ?? "").trim();
  const instituicao = String(formacao.instituicao ?? "").trim();
  const semestreRaw = String(formacao.semestre ?? "").trim();
  let semestre = "";
  if (semestreRaw) {
    semestre = /^\d+$/.test(semestreRaw) ? `${semestreRaw}º sem.` : semestreRaw;
  }
  const instCurta = instituicao
    .replace(/Instituto Mau[aá] de Tecnologia/i, "IMT")
    .replace(/\s*\(IMT\)\s*/i, "")
    .trim();
  const instLabel = /imt/i.test(instCurta) ? "IMT" : instCurta;

  let contexto = "";
  if (curso && instLabel) {
    const sem = semestre ? `, ${semestre}` : "";
    contexto = `Estudante de ${curso} (${instLabel}${sem})`;
  } else if (curso) {
    contexto = `Estudante de ${curso}`;
  }

  const foco = {
    "marketing-growth": "mídia, growth e leitura de performance",
    "dados-bi-analytics": "análise de dados aplicada a negócio",
    desenvolvimento: "produtos web e entregas de software",
    "ia-ml": "produtos e fluxos com IA",
  }[perfil.slug] ?? perfil.label.toLowerCase();

  if (contexto && stack) {
    return `${contexto} com experiência prática em ${stack}, em ${foco}`;
  }
  if (contexto) {
    return `${contexto} com foco em ${foco}`;
  }
  return fazBemParaSegmento(perfil, stack);
}

function encaixeParaResumo(perfil, ctx) {
  const primarios = ctx.primarios ?? [];
  const cargos = [...new Set(primarios.map((a) => a.titulo))].slice(0, 2).join(", ");
  const senior =
    [...new Set(primarios.map((a) => a.senioridade))].slice(0, 2).join(" / ") || "Estágio";

  if (cargos) return `Busco **${senior}** como ${cargos}`;

  if (ctx.tipo === "vaga") {
    const neutro = cargoAlvoNeutroDaVaga(perfil, ctx.titulo, ctx.descricao)
      .replace(/^est[aá]gio\s*\/\s*trainee\s+em\s+/i, "estágio em ")
      .trim();
    if (neutro) return `Busco **${neutro}**`;
  }

  const cargoAlvo = String(perfil.cargoAlvo ?? "")
    .replace(/^est[aá]gio\s*\/\s*trainee\s+em\s+/i, "estágio em ")
    .trim();
  if (cargoAlvo) return `Busco **${cargoAlvo}**`;
  return `Busco **Estágio** em ${perfil.label}`;
}

/** Resumo denso: contexto + stack → prova → encaixe (estilo feito à mão). */
export function buildResumoPerfil(perfil, ctx) {
  const stack = stackCurtaParaResumo(perfil, ctx);
  let abertura = aberturaResumo(perfil, stack, ctx);

  if (ctx?.tipo === "vaga" && stack) {
    const n = normalizeTexto(`${ctx.titulo ?? ""}\n${ctx.descricao ?? ""}`);
    if (/agente|prompt/.test(n) && perfil.slug === "ia-ml") {
      const formacaoBit = abertura.startsWith("Estudante")
        ? abertura.split(" com experiência")[0]
        : null;
      const corpo = `com experiência prática em ${stack}, montando fluxos com IA (prompts, RAG e integrações)`;
      abertura = formacaoBit ? `${formacaoBit} ${corpo}` : `Atuo ${corpo}`;
    }
  }

  let prova = String(provaParaResumo(perfil, ctx) ?? "")
    .replace(/\*\*/g, "")
    .trim();
  const resumoExp = String(perfil.resumoExp ?? "")
    .replace(/\*\*/g, "")
    .trim();
  // Dados/dev/growth: prova de estágio (resumoExp) soa mais “feito à mão” que só nome de projeto
  if (resumoExp && perfil.slug !== "ia-ml" && /^No projeto/i.test(prova)) {
    prova = resumoExp;
  } else if (!prova && resumoExp) {
    prova = resumoExp;
  }

  return [abertura, prova, encaixeParaResumo(perfil, ctx)]
    .filter(Boolean)
    .map((s) => String(s).replace(/\.\s*$/, "").trim())
    .filter(Boolean)
    .join(". ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function competenciasPerfil(perfil) {
  // Fallback denso (1–2 linhas) — o motor real usa tecnologias.yml + evidência.
  const map = {
    "dados-bi-analytics": `- **Ferramentas:** Python, SQL, Excel, Power BI, PostgreSQL, Pandas
- **Idiomas:** Português (nativo), Inglês (avançado), Espanhol (básico)`,
    desenvolvimento: `- **Ferramentas:** React, Next.js, JavaScript, Node.js, FastAPI, PostgreSQL, Git
- **Idiomas:** Português (nativo), Inglês (avançado), Espanhol (básico)`,
    "marketing-growth": `- **Ferramentas:** Google Ads, Meta Ads, Google Analytics 4, SQL, Power BI
- **Idiomas:** Português (nativo), Inglês (avançado), Espanhol (básico)`,
    "ia-ml": `- **Ferramentas:** Python, FastAPI, RAG, PostgreSQL, Next.js, prompt engineering
- **Idiomas:** Português (nativo), Inglês (avançado), Espanhol (básico)`,
  };
  return map[perfil.slug] ?? map["dados-bi-analytics"];
}
