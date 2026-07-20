/**
 * Lista vagas no Trampos.co (API pública — retorna últimas; filtra por título).
 */

import { normalizarTexto } from "../buscaBusca.js";

const TRAMPOS_URL = "https://trampos.co/api/oportunidades";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function mapItem(raw) {
  const opp = raw?.opportunity ?? raw;
  return {
    id: `trampos-${opp.id}`,
    portal: "trampos",
    titulo: String(opp.name ?? "").trim(),
    empresa: String(opp.company_name ?? "").trim(),
    url: String(opp.permalink ?? "").trim(),
    descricao: "",
    cidade: "",
    estado: "",
    modalidade: "",
    tipo: "",
    publicado_em: opp.published_at ?? null,
    logo: null,
  };
}

function bateConsulta(item, consulta) {
  const tokens = normalizarTexto(consulta).split(/\s+/).filter((t) => t.length >= 3);
  if (!tokens.length) return true;
  const blob = normalizarTexto(`${item.titulo} ${item.empresa}`);
  return tokens.some((t) => blob.includes(t));
}

/**
 * @param {string} termo
 * @param {{ maxPaginas?: number }} opts
 */
export async function listarTrampos(termo, opts = {}) {
  const consulta = String(termo ?? "").trim();
  const maxPaginas = Math.min(Number(opts.maxPaginas) || 2, 4);
  const vistos = new Set();
  const out = [];

  for (let page = 1; page <= maxPaginas; page += 1) {
    const params = new URLSearchParams({ page: String(page) });
    const res = await fetch(`${TRAMPOS_URL}?${params}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "TumaEmprego/1.0 (local)",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      throw new Error(`Trampos HTTP ${res.status}`);
    }

    const batch = await res.json();
    if (!Array.isArray(batch) || !batch.length) break;

    for (const raw of batch) {
      const item = mapItem(raw);
      if (!item.url || vistos.has(item.url)) continue;
      if (!bateConsulta(item, consulta)) continue;
      vistos.add(item.url);
      out.push(item);
    }

    await sleep(100);
  }

  return out;
}

export function consultasTramposDeBusca(titulos, senioridades) {
  const niveis = senioridades?.length ? senioridades : ["estagio"];
  const out = [];
  const set = new Set();

  function add(q) {
    const t = String(q ?? "").trim();
    if (!t) return;
    const key = t.toLowerCase();
    if (set.has(key)) return;
    set.add(key);
    out.push(t);
  }

  for (const t of titulos ?? []) add(t);

  if (niveis.includes("estagio")) {
    for (const t of (titulos ?? []).slice(0, 2)) {
      add(`estágio ${String(t).split(/\s+/).slice(-2).join(" ")}`);
    }
  }

  return out.slice(0, 5);
}
