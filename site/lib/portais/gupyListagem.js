/**
 * Lista vagas públicas no portal Gupy (employability-portal).
 */

const GUPY_JOBS_URL = "https://employability-portal.gupy.io/api/v1/jobs";

const MODALIDADE_PARA_API = {
  remoto: "remote",
  hibrido: "hybrid",
  presencial: "on-site",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "TumaEmprego/1.0 (local; +https://localhost)",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    throw new Error(`Gupy HTTP ${res.status}`);
  }
  return res.json();
}

function mapItem(raw) {
  const workplace = String(raw.workplaceType ?? "").toLowerCase();
  let modalidade = "presencial";
  if (raw.isRemoteWork || workplace === "remote") modalidade = "remoto";
  else if (workplace === "hybrid") modalidade = "hibrido";

  return {
    id: `gupy-${raw.id}`,
    portal: "gupy",
    titulo: String(raw.name ?? "").trim(),
    empresa: String(raw.careerPageName ?? "").trim(),
    url: String(raw.jobUrl ?? "").trim(),
    descricao: String(raw.description ?? "").trim(),
    cidade: raw.city ?? "",
    estado: raw.state ?? "",
    modalidade,
    tipo: raw.type ?? "",
    publicado_em: raw.publishedDate ?? null,
    logo: raw.careerPageLogo ?? null,
  };
}

/**
 * @param {string} jobName
 * @param {{ limit?: number, modalidades?: string[], maxPaginas?: number, estado?: string }} opts
 */
export async function listarGupy(jobName, opts = {}) {
  const termo = String(jobName ?? "").trim();
  if (!termo) return [];

  const limit = Math.min(Number(opts.limit) || 20, 50);
  const maxPaginas = Math.min(Number(opts.maxPaginas) || 2, 5);
  const modalidades = opts.modalidades ?? [];
  const estado = String(opts.estado ?? "").trim();
  const soRemoto = modalidades.length === 1 && modalidades[0] === "remoto";
  const querRemoto = modalidades.includes("remoto");
  const querLocal = modalidades.some((m) => m !== "remoto");

  const vistos = new Set();
  const out = [];

  async function coletar(extraParams = {}) {
    for (let pagina = 0; pagina < maxPaginas; pagina += 1) {
      const offset = pagina * limit;
      const params = new URLSearchParams({
        jobName: termo,
        limit: String(limit),
        offset: String(offset),
        ...extraParams,
      });

      const json = await fetchJson(`${GUPY_JOBS_URL}?${params}`);
      const batch = Array.isArray(json?.data) ? json.data : [];
      if (!batch.length) break;

      for (const raw of batch) {
        const item = mapItem(raw);
        if (!item.url || vistos.has(item.url)) continue;

        if (modalidades.length && !extraParams.isRemoteWork) {
          if (!modalidades.includes(item.modalidade)) continue;
        }

        vistos.add(item.url);
        out.push(item);
      }

      const total = Number(json?.pagination?.total ?? 0);
      if (offset + limit >= total) break;
      await sleep(120);
    }
  }

  if (soRemoto) {
    await coletar({ isRemoteWork: "true" });
    return out;
  }

  if (querLocal) {
    await coletar(estado ? { state: estado } : {});
  }
  if (querRemoto) {
    await coletar({ isRemoteWork: "true" });
  }

  return out;
}

/** Monta consultas a partir dos títulos ativos (sem prefixo que zera a API). */
export function consultasGupyDeBusca(titulos, senioridades) {
  const niveis = senioridades?.length ? senioridades : ["estagio"];
  const principais = [];
  const extras = [];
  const set = new Set();

  function add(lista, q) {
    const t = String(q ?? "").trim();
    if (!t) return;
    const key = t.toLowerCase();
    if (set.has(key)) return;
    set.add(key);
    lista.push(t);
  }

  for (const t of titulos ?? []) {
    add(principais, t);
  }

  if (niveis.includes("estagio") || niveis.includes("trainee")) {
    const palavras = new Set();
    for (const t of titulos ?? []) {
      for (const w of normalizeConsulta(t).split(/\s+/)) {
        if (w.length >= 4 && !STOP.has(w)) palavras.add(w);
      }
    }
    const prefixo = niveis.includes("estagio") ? "estágio" : "trainee";
    for (const w of [...palavras].slice(0, 4)) {
      add(extras, `${prefixo} ${w}`);
    }
  }

  return [...principais.slice(0, 4), ...extras].slice(0, 7);
}

const STOP = new Set([
  "analista", "assistente", "desenvolvedor", "engenheiro", "pessoa", "cargo", "geral",
]);

function normalizeConsulta(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export { MODALIDADE_PARA_API };
