import { CAMPOS_NIVEL } from "./tecnologiasCampos.js";

function parseOutrasTecnologias(texto) {
  return String(texto ?? "")
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Lista plana de tecnologias do perfil (com nível quando houver). Client-safe. */
export function extrairTecnologiasPerfil(tecnologias) {
  if (!tecnologias) return { comNivel: [], outras: [], todas: [] };

  const comNivel = CAMPOS_NIVEL.filter((c) => tecnologias[c.key]?.trim()).map((c) => ({
    nome: c.label,
    slug: c.key,
    nivel: tecnologias[c.key].trim(),
  }));

  const outras = parseOutrasTecnologias(tecnologias.outras);
  const todas = [...comNivel.map((t) => t.nome), ...outras];

  return { comNivel, outras, todas: [...new Set(todas)] };
}
