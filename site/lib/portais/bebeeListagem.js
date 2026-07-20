/**
 * Lista vagas via Bebee BR — agrega InfoJobs/Pandapé, Sólides, Workday, etc.
 */

import { normalizarTexto } from "../buscaBusca.js";

const BEBEE_URL = "https://br.bebee.com/api/jobs";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseLocal(nome) {
  const partes = String(nome ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!partes.length) return { cidade: "", estado: "" };
  if (partes[0].toLowerCase() === "remoto") {
    return { cidade: "", estado: "", remoto: true };
  }
  return { cidade: partes[0] ?? "", estado: partes[1] ?? "" };
}

function mapModalidade(raw, local) {
  if (local?.remoto) return "remoto";
  const p = String(raw ?? "").toLowerCase();
  if (p.includes("remote") || p.includes("remoto")) return "remoto";
  if (p.includes("hybrid") || p.includes("hibrid")) return "hibrido";
  return "presencial";
}

function mapItem(raw) {
  const local = parseLocal(raw.location_name);
  const modalidade = mapModalidade(raw.remote_policy, local);
  const tipo = [raw.contract_type, raw.source_name].filter(Boolean).join(" · ");

  return {
    id: `bebee-${raw.id}`,
    portal: "bebee",
    titulo: String(raw.title ?? "").trim(),
    empresa: String(raw.publisher_name ?? raw.blind_publisher_permalink ?? "").trim(),
    url: String(raw.url ?? "").trim(),
    descricao: String(raw.description ?? "").trim(),
    cidade: local.cidade,
    estado: local.estado,
    modalidade,
    tipo,
    publicado_em: raw.started_date ?? null,
    logo: null,
  };
}

/**
 * @param {string} query
 * @param {{ limit?: number, maxPaginas?: number, modalidades?: string[], local?: string }} opts
 */
export async function listarBebee(query, opts = {}) {
  const termo = String(query ?? "").trim();
  if (!termo) return { vagas: [], aviso: null };

  const limit = Math.min(Number(opts.limit) || 15, 20);
  const maxPaginas = Math.min(Number(opts.maxPaginas) || 1, 3);
  const modalidades = opts.modalidades ?? [];
  const local = String(opts.local ?? "").trim();
  const querRemoto = modalidades.includes("remoto");
  const querLocal = modalidades.some((m) => m !== "remoto");

  const vistos = new Set();
  const out = [];

  async function coletar(extra = {}) {
    for (let page = 1; page <= maxPaginas; page += 1) {
      const params = new URLSearchParams({
        q: termo,
        page: String(page),
        limit: String(limit),
        ...extra,
      });

      const res = await fetch(`${BEBEE_URL}?${params}`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "TumaEmprego/1.0 (local)",
        },
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) {
        throw new Error(`Bebee HTTP ${res.status}`);
      }

      const json = await res.json();
      const batch = Array.isArray(json?.jobs) ? json.jobs : [];
      if (!batch.length) break;

      for (const raw of batch) {
        const item = mapItem(raw);
        if (!item.url || vistos.has(item.url)) continue;

        if (modalidades.length) {
          if (!modalidades.includes(item.modalidade)) continue;
        }

        vistos.add(item.url);
        out.push(item);
      }

      const totalPages = Number(json?.totalPages ?? 1);
      if (page >= totalPages) break;
      await sleep(120);
    }
  }

  if (querLocal && local) {
    await coletar({ location: local });
  } else if (querLocal) {
    await coletar();
  }

  if (querRemoto) {
    await coletar({ q: `${termo} remoto` });
  }

  if (!querLocal && !querRemoto) {
    await coletar(local ? { location: local } : {});
  }

  return { vagas: out, aviso: null };
}

export function consultasBebeeDeBusca(titulos, senioridades) {
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
    for (const t of (titulos ?? []).slice(0, 3)) {
      add(`estágio ${String(t).split(/\s+/).slice(-2).join(" ")}`);
    }
  }

  return out.slice(0, 6);
}

export function localBebeeDePerfil(profile = {}) {
  const cidade = String(profile.cidade ?? "").trim();
  if (cidade) return cidade;
  const uf = String(profile.estado ?? "").trim().toUpperCase();
  if (uf === "SP") return "São Paulo";
  if (uf === "RJ") return "Rio de Janeiro";
  if (uf === "MG") return "Belo Horizonte";
  return null;
}

/** Filtra vagas Bebee cujo título bate com a consulta (refino local). */
export function tituloBebeeBateConsulta(item, consulta) {
  const tokens = normalizarTexto(consulta).split(/\s+/).filter((t) => t.length >= 3);
  if (!tokens.length) return true;
  const blob = normalizarTexto(item.titulo);
  return tokens.some((t) => blob.includes(t));
}
