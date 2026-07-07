/**
 * Converte dados/config/tecnologias.yml em itens no formato de banco.ferramentas.
 */

import { SEGMENTOS_CV_SLOTS } from "./conteudoConstants.js";
import { extrairTecnologiasPerfil } from "./tecnologiasUtils.js";

const CATEGORIA_POR_CAMPO = {
  excel: "Dados",
  sql: "Dados / back-end",
  power_bi: "BI",
  python: "Dados / back-end",
  javascript: "Front-end",
  git: "DevOps",
  postgresql: "Banco de dados",
};

const SEGMENTOS_POR_CAMPO = {
  excel: ["dados-bi-analytics", "marketing-growth"],
  sql: ["dados-bi-analytics", "desenvolvimento", "ia-ml", "marketing-growth"],
  power_bi: ["dados-bi-analytics", "marketing-growth"],
  python: ["dados-bi-analytics", "desenvolvimento", "ia-ml"],
  javascript: ["desenvolvimento"],
  git: ["desenvolvimento"],
  postgresql: ["dados-bi-analytics", "desenvolvimento", "ia-ml"],
};

const SEGMENTOS_POR_NOME = {
  n8n: ["desenvolvimento", "ia-ml", "marketing-growth"],
  react: ["desenvolvimento"],
  "next.js": ["desenvolvimento", "ia-ml"],
  nextjs: ["desenvolvimento", "ia-ml"],
  fastapi: ["desenvolvimento", "ia-ml"],
  html: ["desenvolvimento"],
  css: ["desenvolvimento"],
  "google analytics 4": ["dados-bi-analytics", "marketing-growth"],
  "google analytics": ["dados-bi-analytics", "marketing-growth"],
  "google tag manager": ["marketing-growth", "dados-bi-analytics"],
  "google ads": ["marketing-growth"],
  "meta ads": ["marketing-growth"],
};

const CATEGORIA_POR_NOME = {
  n8n: "Automação",
  react: "Front-end",
  "next.js": "Front-end",
  nextjs: "Front-end",
  fastapi: "Back-end",
  html: "Front-end",
  css: "Front-end",
  "google analytics 4": "Marketing / analytics",
  "google analytics": "Marketing / analytics",
  "google tag manager": "Marketing / analytics",
  "google ads": "Marketing",
  "meta ads": "Marketing",
};

function slugId(texto) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function segmentosParaNome(nome) {
  const lower = nome.toLowerCase().trim();
  return SEGMENTOS_POR_NOME[lower] ?? [...SEGMENTOS_CV_SLOTS];
}

function categoriaParaNome(nome) {
  const lower = nome.toLowerCase().trim();
  return CATEGORIA_POR_NOME[lower] ?? "Ferramentas";
}

/** Lista { id, nome, categoria, segmentos, origem: 'perfil', nivel? } */
export function ferramentasDoPerfil(tecnologiasRaw) {
  const { comNivel, outras } = extrairTecnologiasPerfil(tecnologiasRaw);
  const items = [];

  for (const t of comNivel) {
    items.push({
      id: `perfil-${t.slug}`,
      nome: t.nome,
      categoria: CATEGORIA_POR_CAMPO[t.slug] ?? "Ferramentas",
      segmentos: SEGMENTOS_POR_CAMPO[t.slug] ?? [...SEGMENTOS_CV_SLOTS],
      origem: "perfil",
      nivel: t.nivel,
    });
  }

  for (const nome of outras) {
    items.push({
      id: `perfil-outra-${slugId(nome)}`,
      nome,
      categoria: categoriaParaNome(nome),
      segmentos: segmentosParaNome(nome),
      origem: "perfil",
    });
  }

  return items;
}

export function mesclarFerramentas(bancoFerramentas, perfilFerramentas) {
  const banco = bancoFerramentas ?? [];
  const nomesBanco = new Set(banco.map((f) => String(f.nome).toLowerCase()));
  const doPerfil = (perfilFerramentas ?? []).filter(
    (f) => f.nome && !nomesBanco.has(String(f.nome).toLowerCase()),
  );
  return [...banco, ...doPerfil];
}

/** Copia itens do perfil para o banco (sem duplicar por nome). */
export function importarFerramentasDoPerfil(banco, perfilFerramentas) {
  const existentes = banco?.ferramentas ?? [];
  const nomes = new Set(existentes.map((f) => String(f.nome).toLowerCase()));
  const novas = [];

  for (const f of perfilFerramentas ?? []) {
    if (!f.nome || nomes.has(String(f.nome).toLowerCase())) continue;
    nomes.add(String(f.nome).toLowerCase());
    novas.push({
      id: `tool-${slugId(f.nome)}`,
      nome: f.nome,
      categoria: f.categoria ?? "Ferramentas",
      segmentos: f.segmentos ?? [...SEGMENTOS_CV_SLOTS],
    });
  }

  return {
    ...banco,
    ferramentas: [...existentes, ...novas],
  };
}
