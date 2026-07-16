/**
 * Stack unificado do perfil — catálogo + extras, filtrado por segmento de CV.
 */

import { SEGMENTOS_CV_SLOTS } from "./conteudoConstants.js";

export function slugId(texto) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Segmentos efetivos do item (sem fallback “todos”). */
function segmentosDoItem(item) {
  const seg = item?.segmentos ?? item?.segmentosCv ?? [];
  return Array.isArray(seg) ? seg.filter(Boolean) : [];
}

function normalizarExtra(raw) {
  const nome = String(raw?.nome ?? "").trim();
  if (!nome) return null;
  const id = raw?.id?.trim() || `extra-${slugId(nome)}`;
  const segmentos = Array.isArray(raw?.segmentos) ? raw.segmentos.filter(Boolean) : [];
  return {
    id,
    nome,
    categoria: String(raw?.categoria ?? "Ferramentas").trim() || "Ferramentas",
    segmentos: segmentos.length ? segmentos : [...SEGMENTOS_CV_SLOTS],
    origem: "extra",
  };
}

/** Catálogo ativo + extras — lista plana para motor e UI. */
export function listarStackItens(tecnologias) {
  const catalogo = (tecnologias?.itens ?? []).map((item) => ({
    id: item.slug,
    slug: item.slug,
    nome: item.nome,
    categoria: item.categoria ?? "",
    vertenteSlug: item.vertenteSlug ?? "",
    vertenteNome: item.vertenteNome ?? "",
    segmentos: segmentosDoItem(item),
    segmentosCv: segmentosDoItem(item),
    origem: "catalogo",
  }));

  const extras = (tecnologias?.extras ?? [])
    .map(normalizarExtra)
    .filter(Boolean)
    .map((item) => ({
      ...item,
      slug: null,
      segmentosCv: item.segmentos,
    }));

  return [...catalogo, ...extras];
}

function nomesCatalogoLower(itens) {
  return new Set((itens ?? []).map((i) => String(i.nome).toLowerCase()));
}

/** Move ferramentas do banco.yml para extras do perfil (uma vez). */
export function migrarFerramentasBancoParaStack(tecnologias, ferramentasBanco = []) {
  const base = { ...tecnologias, extras: [...(tecnologias?.extras ?? [])] };
  const nomesCat = nomesCatalogoLower(base.itens);
  const nomesExtras = new Set(base.extras.map((e) => String(e.nome).toLowerCase()));
  let mudou = false;

  for (const f of ferramentasBanco ?? []) {
    const nome = String(f?.nome ?? "").trim();
    if (!nome) continue;
    const key = nome.toLowerCase();
    if (nomesCat.has(key) || nomesExtras.has(key)) continue;

    base.extras.push({
      id: f.id?.startsWith("perfil-") ? f.id.replace(/^perfil-/, "extra-") : `extra-${slugId(nome)}`,
      nome,
      categoria: f.categoria ?? "Ferramentas",
      segmentos: Array.isArray(f.segmentos) && f.segmentos.length ? f.segmentos : [...SEGMENTOS_CV_SLOTS],
    });
    nomesExtras.add(key);
    mudou = true;
  }

  return { tecnologias: base, mudou };
}

export function aplicarOverridesSegmentos(itens, overrides = {}) {
  return (itens ?? []).map((item) => {
    const custom = overrides[item.slug];
    if (!Array.isArray(custom) || !custom.length) return item;
    return { ...item, segmentosCv: custom.filter(Boolean) };
  });
}
