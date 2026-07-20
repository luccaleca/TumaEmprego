/**
 * Lista vagas no portal Sólides (API pública do gateway).
 */

const SOLIDES_URL = "https://apigw.solides.com.br/jobs/v3/portal-vacancies-new";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function mapModalidade(raw) {
  const jt = String(raw.jobType ?? "").toLowerCase();
  if (raw.homeOffice || jt.includes("home") || jt === "remoto" || jt === "remote") {
    return "remoto";
  }
  if (jt.includes("hibrid") || jt === "hybrid") return "hibrido";
  return "presencial";
}

function mapItem(raw) {
  const senior = (raw.seniority ?? []).map((s) => s.name).filter(Boolean).join(", ");
  const contrato = (raw.recruitmentContractType ?? [])
    .map((s) => s.name)
    .filter(Boolean)
    .join(", ");

  return {
    id: `solides-${raw.id}`,
    portal: "solides",
    titulo: String(raw.title ?? "").trim(),
    empresa: String(raw.companyName ?? "").trim(),
    url: String(raw.redirectLink ?? "").trim(),
    descricao: String(raw.description ?? "").trim(),
    cidade: raw.city?.name ?? raw.address?.city?.name ?? "",
    estado: raw.state?.name ?? raw.state?.code ?? raw.address?.state?.name ?? "",
    modalidade: mapModalidade(raw),
    tipo: [senior, contrato].filter(Boolean).join(" · "),
    publicado_em: raw.createdAt ?? null,
    logo: raw.companyLogo ?? null,
  };
}

/**
 * @param {string} title
 * @param {{ take?: number, page?: number, maxPaginas?: number, modalidades?: string[] }} opts
 */
export async function listarSolides(title, opts = {}) {
  const termo = String(title ?? "").trim();
  if (!termo) {
    return { vagas: [], aviso: null };
  }

  const take = Math.min(Number(opts.take) || 15, 40);
  const maxPaginas = Math.min(Number(opts.maxPaginas) || 1, 3);
  const modalidades = opts.modalidades ?? [];
  const vistos = new Set();
  const out = [];

  for (let page = 1; page <= maxPaginas; page += 1) {
    const params = new URLSearchParams({
      title: termo,
      titulo: termo,
      locations: "",
      take: String(take),
      page: String(page),
    });

    const res = await fetch(`${SOLIDES_URL}?${params}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "TumaEmprego/1.0 (local)",
        Origin: "https://vagas.solides.com.br",
        Referer: "https://vagas.solides.com.br/",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      throw new Error(`Sólides HTTP ${res.status}`);
    }

    const json = await res.json();
    const batch = Array.isArray(json?.data?.data) ? json.data.data : [];
    if (!batch.length) break;

    for (const raw of batch) {
      const item = mapItem(raw);
      if (!item.url || vistos.has(item.url)) continue;
      vistos.add(item.url);
      if (modalidades.length && !modalidades.includes(item.modalidade)) continue;
      out.push(item);
    }

    const totalPages = Number(json?.data?.totalPages ?? 1);
    if (page >= totalPages) break;
    await sleep(150);
  }

  return { vagas: out, aviso: null };
}

export function consultasSolidesDeBusca(titulos, senioridades) {
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
    const palavras = new Set();
    for (const t of titulos ?? []) {
      for (const w of String(t)
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .split(/\s+/)) {
        if (w.length >= 4 && !["analista", "assistente", "desenvolvedor"].includes(w)) {
          palavras.add(w);
        }
      }
    }
    for (const w of [...palavras].slice(0, 3)) add(`estágio ${w}`);
  }

  return out.slice(0, 6);
}
