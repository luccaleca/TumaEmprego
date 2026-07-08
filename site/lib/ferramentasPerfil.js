/**
 * Converte dados/config/tecnologias.yml em itens no formato de banco.ferramentas.
 */

import { SEGMENTOS_CV_SLOTS } from "./conteudoConstants.js";
import { extrairTecnologiasPerfil } from "./tecnologiasUtils.js";

function slugId(texto) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Lista { id, nome, categoria, segmentos, origem: 'perfil' } */
export function ferramentasDoPerfil(tecnologiasRaw) {
  const { comNivel } = extrairTecnologiasPerfil(tecnologiasRaw);
  const items = [];

  for (const t of comNivel) {
    items.push({
      id: `perfil-${t.slug}`,
      nome: t.nome,
      categoria: t.categoria || t.vertenteSlug || "Ferramentas",
      segmentos: t.segmentosCv?.length ? t.segmentosCv : [...SEGMENTOS_CV_SLOTS],
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
