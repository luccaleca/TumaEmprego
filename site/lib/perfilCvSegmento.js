/**
 * Perfis de currículo por segmento/vaga — o motor local monta um CV focado por área.
 */

import { getFonteCandidato, termosParaSegmento, termosTecnologiaCandidato } from "./fonteCandidato.js";

export const CERTS_UDEMY = {
  python: "Python para Data Science e Machine Learning Bootcamp — José Portilla (Udemy)",
  sql: "SQL para Análise de Dados: Do Básico ao Avançado — Midori Ishizuka (Udemy)",
  postgresql: "PostgreSQL: Do Básico ao Avançado — Felipe Mafra (Udemy)",
  powerbi: "Microsoft Power BI para Data Science — André Rosa (Udemy)",
  pandas: "Manipulação e Análise de Dados com Python e Pandas — Clevison Santos (Udemy)",
  react: "React - The Complete Guide — Maximilian Schwarzmüller (Udemy)",
  node: "Node.js, Express, MongoDB & More: The Complete Bootcamp — Jonas Schmedtmann (Udemy)",
  javascript: "The Complete JavaScript Course 2024 — Jonas Schmedtmann (Udemy)",
  typescript: "Understanding TypeScript — Maximilian Schwarzmüller (Udemy)",
  nextjs: "Next.js & React - The Complete Guide — Maximilian Schwarzmüller (Udemy)",
  digitalMarketing: "The Complete Digital Marketing Guide — Rob Percival (Udemy)",
  googleAds: "Google Ads (Adwords) Completo — Do Zero ao PRO (M2up)",
  analytics: "Certificação de Analytics — Google Skillshop",
};

export const PERFIS = {
  "dados-bi-analytics": {
    slug: "dados-bi-analytics",
    label: "Dados, BI e Analytics",
    cargoAlvo: "Estágio / Trainee em Análise de Dados, BI e Analytics",
    stack: "SQL · Python · Power BI · PostgreSQL · Pandas · Excel · Supabase",
    foco: "Análise de Dados · BI · Dashboards · ETL · KPIs",
    termos: [
      "sql", "python", "power bi", "dados", "analytics", "bi", "dashboard", "kpi",
      "postgresql", "supabase", "etl", "excel", "pandas", "modelagem",
    ],
    certificacoes: [
      CERTS_UDEMY.analytics,
      CERTS_UDEMY.sql,
      CERTS_UDEMY.python,
      CERTS_UDEMY.postgresql,
      CERTS_UDEMY.powerbi,
      CERTS_UDEMY.pandas,
    ],
    projetosOrdem: ["Projeto de Portfólio"],
    projetosOmitir: [],
    expTitulo: "Experiência profissional — Análise de Dados",
    expNota: "Foco em SQL, Python, Power BI e KPIs.",
    resumoExtra:
      "Destaque projetos de dados e BI do seu banco de conteúdo (`conteudo/banco.yml`).",
    resumoExp:
      "Experiência com **SQL**, **Python** e **Power BI** — consultas, dashboards e análises que apoiaram decisões de negócio.",
  },

  desenvolvimento: {
    slug: "desenvolvimento",
    label: "Desenvolvimento de Software",
    cargoAlvo: "Estágio / Trainee em Desenvolvimento de Software (Web / Full Stack)",
    stack: "JavaScript · TypeScript · React · Next.js · Node.js · Express · PostgreSQL · Git",
    foco: "Desenvolvimento Web · APIs · Full Stack · Front-end · Back-end",
    termos: [
      "javascript", "typescript", "react", "next.js", "nextjs", "node", "express", "api",
      "full stack", "front-end", "frontend", "back-end", "backend", "git", "html", "css",
      "postgresql", "prisma",
    ],
    certificacoes: [
      CERTS_UDEMY.javascript,
      CERTS_UDEMY.react,
      CERTS_UDEMY.nextjs,
      CERTS_UDEMY.node,
      CERTS_UDEMY.typescript,
      CERTS_UDEMY.python,
    ],
    projetosOrdem: ["Projeto de Portfólio"],
    projetosOmitir: [],
    expTitulo: "Experiência profissional — Desenvolvimento de Software",
    expNota: "Foco em React, Next.js, Node.js e entregas web.",
    resumoExtra:
      "Inclua projetos full stack do seu `banco.yml` (front, API, banco).",
    resumoExp:
      "Experiência com **React**, **Next.js**, **Node.js** e **SQL** — interfaces, APIs e automações em ambiente real.",
  },

  "marketing-growth": {
    slug: "marketing-growth",
    label: "Marketing Digital / Growth",
    cargoAlvo: "Estágio / Trainee em Marketing Digital, Growth e Performance",
    stack: "Google Analytics 4 · Google Ads · Meta Ads · Power BI · SQL · Python · GTM",
    foco: "Growth Marketing · Performance · Analytics · Tráfego Pago · Segmentação",
    termos: [
      "marketing", "growth", "google ads", "meta ads", "analytics", "ga4", "gtm",
      "performance", "segmentação", "kpi", "power bi", "sql", "python", "shopify", "vtex",
    ],
    certificacoes: [
      CERTS_UDEMY.analytics,
      CERTS_UDEMY.googleAds,
      CERTS_UDEMY.digitalMarketing,
      CERTS_UDEMY.powerbi,
      CERTS_UDEMY.sql,
    ],
    projetosOrdem: ["Projeto de Portfólio"],
    projetosOmitir: [],
    expTitulo: "Experiência profissional — Marketing / Growth",
    expNota: "Foco em campanhas, analytics e KPIs.",
    resumoExtra:
      "Projetos com tráfego pago, GA4 ou growth vêm do seu conteúdo cadastrado.",
    resumoExp:
      "Experiência com **Google Ads**, **Meta Ads**, **SQL** e **Power BI** — campanhas, segmentação e leitura de performance.",
  },

  "ia-ml": {
    slug: "ia-ml",
    label: "Inteligência Artificial / ML",
    cargoAlvo: "Estágio / Trainee em IA, ML ou Engenharia de IA",
    stack: "Python · LLM · RAG · FastAPI · PostgreSQL · Next.js · Prompt engineering",
    foco: "IA aplicada · RAG · Chat SQL · Automação · Integração LLM",
    termos: [
      "ia", "inteligência artificial", "machine learning", "llm", "rag", "python",
      "fastapi", "postgresql", "prompt", "gemini", "chroma",
    ],
    certificacoes: [
      CERTS_UDEMY.python,
      CERTS_UDEMY.pandas,
      CERTS_UDEMY.sql,
      CERTS_UDEMY.postgresql,
    ],
    projetosOrdem: ["Projeto de Portfólio"],
    projetosOmitir: [],
    expTitulo: "Experiência profissional — Dados para Produto",
    expNota: "Foco em base analítica e priorização com SQL/Python.",
    resumoExtra:
      "Projetos com LLM, RAG ou automação devem estar no `banco.yml`.",
    resumoExp:
      "Experiência montando base analítica com **SQL**, **Python** e ferramentas de BI para apoiar produto e operação.",
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

export function inferirPerfilPorVaga(titulo, descricao, fonte = null) {
  const f = fonte ?? getFonteCandidato();
  const texto = `${titulo}\n${descricao}`;

  const scores = {
    "marketing-growth": scoreTermos(texto, TERMOS_MARKETING) * 2,
    "ia-ml": scoreTermos(texto, TERMOS_IA) * 2,
    desenvolvimento: scoreTermos(texto, TERMOS_DEV) * 2,
    "dados-bi-analytics": scoreTermos(texto, TERMOS_DADOS) * 2,
  };

  for (const slug of Object.keys(scores)) {
    for (const termo of termosParaSegmento(slug, f)) {
      if (normalize(texto).includes(normalize(termo))) {
        scores[slug] += 3;
      }
    }
  }

  const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return winner[1] === 0 ? "dados-bi-analytics" : winner[0];
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

export function buildResumoPerfil(perfil, ctx) {
  const primarios = ctx.primarios ?? [];
  const cargos = [...new Set(primarios.map((a) => a.titulo))].slice(0, 3).join(", ");
  const senior =
    [...new Set(primarios.map((a) => a.senioridade))].slice(0, 2).join(" / ") || "Estágio";

  const objetivo =
    ctx.tipo === "vaga"
      ? `Candidato a **${ctx.titulo}**`
      : `Busco **${senior}** como ${cargos || perfil.label}`;

  const paragrafo = `${objetivo}. Com entregas em ${perfil.stack}. ${perfil.resumoExp ?? ""} ${perfil.resumoExtra}`.replace(
    /\s{2,}/g,
    " ",
  ).trim();

  return paragrafo;
}

export function competenciasPerfil(perfil) {
  const map = {
    "dados-bi-analytics": `- **Linguagens / dados:** Python, SQL, Excel
- **BI / visualização:** Power BI, DAX, dashboards, KPIs, Google Analytics 4
- **Banco de dados:** PostgreSQL, Supabase, modelagem relacional, ETL
- **Bibliotecas:** Pandas, tratamento de CSV, consultas analíticas
- **Idiomas:** Português (nativo), Inglês (avançado), Espanhol (básico)`,
    desenvolvimento: `- **Front-end:** React, Next.js, HTML, CSS, JavaScript, TypeScript
- **Back-end:** Node.js, Express, FastAPI, REST APIs
- **Banco / DevOps:** PostgreSQL, Supabase, Prisma, Git
- **Automação:** n8n, Python para apoio a produto
- **Idiomas:** Português (nativo), Inglês (avançado), Espanhol (básico)`,
    "marketing-growth": `- **Performance / mídia:** Google Ads, Meta Ads, campanhas e otimização
- **Analytics:** Google Analytics 4, Google Tag Manager, funis e KPIs
- **Dados para growth:** SQL, Python, Power BI, segmentação de público
- **E-commerce:** Shopify, VTEX, relatórios comerciais
- **Idiomas:** Português (nativo), Inglês (avançado), Espanhol (básico)`,
    "ia-ml": `- **IA / ML:** LLM, RAG (Chroma), prompt engineering, OpenRouter/Gemini/Ollama
- **Back-end:** Python, FastAPI, APIs de inferência
- **Dados:** PostgreSQL, SQL, analytics para features de IA
- **Web:** Next.js, React — produto com IA embarcada
- **Idiomas:** Português (nativo), Inglês (avançado), Espanhol (básico)`,
  };
  return map[perfil.slug] ?? map["dados-bi-analytics"];
}

export const BULLETS_PROJETO = {
  TumaCore: {
    "dados-bi-analytics": {
      stack: "Python, FastAPI, Next.js, PostgreSQL, Supabase, RAG (Chroma), LLM",
      bullets: [
        "Construí **centro de dados** do ecossistema TumaIA: hub operacional sobre Postgres/Supabase com KPIs, evolução de pedidos e distribuição por segmento/região.",
        "Desenvolvi **Chat SQL**: pergunta em português → leitura do `information_schema` → geração de SQL PostgreSQL executável.",
        "Entreguei módulos de **analytics** (saúde do produto, performance, tendências) e visão de carteira de clientes.",
      ],
    },
    desenvolvimento: {
      stack: "Python, FastAPI, Next.js, PostgreSQL, Supabase",
      bullets: [
        "Desenvolvi plataforma B2B com **FastAPI + Next.js** e PostgreSQL/Supabase.",
        "Implementei API de consulta assistida a dados e módulos de dashboards operacionais.",
        "Integrei RAG (Chroma) e LLM (Ollama/OpenRouter/Gemini) ao produto.",
      ],
    },
    "marketing-growth": {
      stack: "Next.js, PostgreSQL, KPIs, Analytics",
      bullets: [
        "Construí dashboards de **KPIs de growth**: evolução de pedidos, segmentos, regiões e funil operacional.",
        "Entreguei analytics de saúde do produto, uso e performance para orientar campanhas.",
      ],
    },
    "ia-ml": {
      stack: "Python, FastAPI, RAG (Chroma), LLM, PostgreSQL, Next.js",
      bullets: [
        "Arquitetei **RAG + LLM** sobre PostgreSQL com leitura dinâmica de schema.",
        "Implementei **Chat SQL** em linguagem natural com geração de consultas PostgreSQL.",
        "Integrei Ollama, OpenRouter e Gemini em fluxo Next.js + FastAPI.",
      ],
    },
  },
  TumaIA: {
    desenvolvimento: {
      stack: "JavaScript, Next.js, React, Express, Supabase, Python, n8n",
      bullets: [
        "Desenvolvi SaaS multi-tenant: **Next.js + React**, API **Node/Express** e **Supabase**.",
        "Implementei fluxo WhatsApp → IA gera post → aprovação → publicação no Instagram.",
        "Integrei **n8n** para automação do pipeline operacional.",
      ],
    },
    "marketing-growth": {
      stack: "Next.js, Supabase, n8n, IA generativa, Instagram",
      bullets: [
        "Criei SaaS de **marketing com IA** para PMEs: WhatsApp → geração de criativo + legenda → Instagram.",
        "Automatizei aprovação e publicação com **n8n**.",
        "Contextualizei marca no Supabase para posts alinhados à identidade visual.",
      ],
    },
    "ia-ml": {
      stack: "Python (IA), Next.js, Supabase, n8n, LLM",
      bullets: [
        "Produto com **IA generativa** para posts (imagem + legenda) a partir de contexto de marca.",
        "Orquestração via n8n e integração com APIs de publicação.",
      ],
    },
  },
  "Tuma Emprego": {
    desenvolvimento: {
      stack: "Next.js, React, PostgreSQL, Prisma, YAML",
      bullets: [
        "Desenvolvo hub local com **Next.js**, **PostgreSQL + Prisma** e configs YAML.",
        "Implementei adaptação de CV por vaga/segmento e banco de respostas.",
      ],
    },
    "dados-bi-analytics": {
      stack: "PostgreSQL, YAML, segmentação",
      bullets: [
        "Ferramenta com **PostgreSQL** e perfis de busca (segmentos, senioridade) para priorizar candidaturas.",
        "Motor de adaptação de CV por segmento com keywords e reordenação de conteúdo.",
      ],
    },
  },
};
