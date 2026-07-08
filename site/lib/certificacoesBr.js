/**
 * Certificações e cursos de referência — mercado brasileiro, conteúdo em pt-BR.
 * Fallback quando `dados/conteudo/banco.yml` não tem cursos do segmento.
 */

export const CERTIFICACOES_BR = {
  googleAnalytics: "Certificação em Google Analytics — Google Skillshop",
  googleAnalytics4: "Google Analytics 4 — Google Skillshop",
  googleTagManager: "Google Tag Manager — Google Skillshop",
  googleAdsSearch: "Google Ads — Certificação de Pesquisa — Google Skillshop",
  metaBlueprint: "Meta Certified Digital Marketing Associate — Meta Blueprint",
  rdStation: "Certificação RD Station Marketing — RD University",

  sqlMidori: "SQL para Análise de Dados: Do Básico ao Avançado — Midori Ishizuka (Udemy)",
  pythonPortilla: "Python para Data Science e Machine Learning — José Portilla (Udemy)",
  postgresqlMafra: "PostgreSQL: Do Básico ao Avançado — Felipe Mafra (Udemy)",
  powerBiAndre: "Microsoft Power BI para Data Science — André Rosa (Udemy)",
  pandasClevison: "Manipulação e Análise de Dados com Python e Pandas — Clevison Santos (Udemy)",
  excelAvancado: "Excel Avançado para Análise de Dados — Hashtag Treinamentos (Udemy)",

  aluraDataScience: "Formação Data Science — Alura",
  aluraBI: "Formação BI e Visualização de Dados — Alura",
  aluraPython: "Formação Python para Data Science — Alura",
  dioAnaliseDados: "Bootcamp Análise de Dados com Python — DIO",
  azureDataFundamentals: "Microsoft Azure Data Fundamentals (DP-900) — Microsoft Learn (pt-BR)",

  aluraJavaScript: "Formação JavaScript para o Desenvolvimento Web — Alura",
  aluraReact: "Formação React — Alura",
  aluraNode: "Formação Node.js — Alura",
  aluraFullStack: "Formação Full Stack JavaScript — Alura",
  rocketseatNLW: "NLW — Next.js e React — Rocketseat",
  dioJavaScript: "JavaScript ES6+ — DIO",
  dioNode: "Node.js — DIO",
  gitGithub: "Git e GitHub — Alura",

  aluraIA: "Formação Inteligência Artificial — Alura",
  dioBootcampIA: "Bootcamp Inteligência Artificial — DIO",
  azureAIFundamentals: "Microsoft Azure AI Fundamentals (AI-900) — Microsoft Learn (pt-BR)",
  fiapIA: "Pós Tech em Inteligência Artificial — FIAP",
};

/** Ordem sugerida por slot de currículo (segmento). */
export const CERTIFICACOES_POR_SEGMENTO = {
  "dados-bi-analytics": [
    CERTIFICACOES_BR.googleAnalytics4,
    CERTIFICACOES_BR.sqlMidori,
    CERTIFICACOES_BR.pythonPortilla,
    CERTIFICACOES_BR.powerBiAndre,
    CERTIFICACOES_BR.postgresqlMafra,
    CERTIFICACOES_BR.pandasClevison,
    CERTIFICACOES_BR.aluraBI,
    CERTIFICACOES_BR.dioAnaliseDados,
  ],
  desenvolvimento: [
    CERTIFICACOES_BR.aluraJavaScript,
    CERTIFICACOES_BR.aluraReact,
    CERTIFICACOES_BR.aluraNode,
    CERTIFICACOES_BR.rocketseatNLW,
    CERTIFICACOES_BR.postgresqlMafra,
    CERTIFICACOES_BR.gitGithub,
    CERTIFICACOES_BR.dioJavaScript,
  ],
  "engenharia-software": [
    CERTIFICACOES_BR.aluraFullStack,
    CERTIFICACOES_BR.aluraNode,
    CERTIFICACOES_BR.postgresqlMafra,
    CERTIFICACOES_BR.gitGithub,
  ],
  "marketing-growth": [
    CERTIFICACOES_BR.googleAnalytics4,
    CERTIFICACOES_BR.googleAdsSearch,
    CERTIFICACOES_BR.metaBlueprint,
    CERTIFICACOES_BR.googleTagManager,
    CERTIFICACOES_BR.rdStation,
    CERTIFICACOES_BR.powerBiAndre,
    CERTIFICACOES_BR.sqlMidori,
  ],
  "ia-ml": [
    CERTIFICACOES_BR.aluraIA,
    CERTIFICACOES_BR.dioBootcampIA,
    CERTIFICACOES_BR.pythonPortilla,
    CERTIFICACOES_BR.azureAIFundamentals,
    CERTIFICACOES_BR.sqlMidori,
    CERTIFICACOES_BR.postgresqlMafra,
  ],
};

export function certificacoesFallbackSegmento(slug) {
  return CERTIFICACOES_POR_SEGMENTO[slug] ?? CERTIFICACOES_POR_SEGMENTO["dados-bi-analytics"];
}
