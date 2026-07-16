import fs from "fs";
import path from "path";
import { LABELS_SEGMENTO } from "./conteudoConstants.js";
import { enriquecerLogoCandidatura, resolverLogoEmpresa } from "./empresasLogo.js";

const DADOS_ROOT = path.join(process.cwd(), "..", "dados");
const DIR = path.join(DADOS_ROOT, "candidaturas");

export const STATUS_CANDIDATURA = [
  { id: "pronto", label: "Pronto" },
  { id: "enviado", label: "Enviado" },
  { id: "retorno", label: "Retorno" },
];

const STATUS_SET = new Set(STATUS_CANDIDATURA.map((s) => s.id));

function ensureDir() {
  fs.mkdirSync(DIR, { recursive: true });
}

function caminho(id) {
  return path.join(DIR, `${id}.json`);
}

function novoId() {
  return `cand-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function normalizarUrl(url) {
  return String(url ?? "")
    .trim()
    .replace(/\/+$/, "")
    .toLowerCase();
}

function lerArquivo(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function listarCandidaturas() {
  ensureDir();
  const itens = [];
  for (const nome of fs.readdirSync(DIR)) {
    if (!nome.endsWith(".json")) continue;
    const item = lerArquivo(path.join(DIR, nome));
    if (item?.id) itens.push(item);
  }
  return itens
    .map(enriquecerLogoCandidatura)
    .sort((a, b) => String(b.atualizado_em || b.criado_em).localeCompare(String(a.atualizado_em || a.criado_em)));
}

export function getCandidatura(id) {
  if (!id) return null;
  return enriquecerLogoCandidatura(lerArquivo(caminho(id)));
}

export function findCandidaturaPorVagaUrl(vagaUrl) {
  const alvo = normalizarUrl(vagaUrl);
  if (!alvo) return null;
  return listarCandidaturas().find((c) => normalizarUrl(c.vaga_url) === alvo) ?? null;
}

export function findCandidaturaPorSegmentacao(segmentacaoId) {
  if (!segmentacaoId) return null;
  return listarCandidaturas().find((c) => c.segmentacao_id === segmentacaoId) ?? null;
}

/**
 * Cria ou atualiza card a partir do resultado do pacote (Vaga / extensão).
 */
export function upsertCandidaturaDePacote(resultado, { origem = "site-vaga" } = {}) {
  if (!resultado || resultado.status !== "concluido") return null;

  const segmentacao = resultado.segmentacao ?? null;
  const segmentacaoId = segmentacao?.id ?? resultado.segmentacao_id ?? null;
  if (!segmentacaoId) return null;

  ensureDir();
  const agora = new Date().toISOString();
  const vaga_url = String(resultado.vaga_url ?? segmentacao?.vaga_url ?? "").trim();
  const existente =
    findCandidaturaPorSegmentacao(segmentacaoId) ||
    (vaga_url ? findCandidaturaPorVagaUrl(vaga_url) : null);

  const segmento_slug = String(
    resultado.segmento_slug ?? segmentacao?.segmento_slug ?? "",
  ).trim();
  const titulo = String(
    resultado.vaga_titulo ?? segmentacao?.vaga_titulo ?? "Vaga",
  ).trim();
  const empresa = String(
    resultado.vaga_empresa ?? segmentacao?.vaga_empresa ?? existente?.empresa ?? "",
  ).trim();
  const portal = resultado.portal ?? segmentacao?.portal ?? null;
  const logoHint = resolverLogoEmpresa({
    empresa,
    vaga_titulo: titulo,
    vaga_url,
  });

  const base = {
    id: existente?.id ?? novoId(),
    status: existente?.status && STATUS_SET.has(existente.status) ? existente.status : "pronto",
    criado_em: existente?.criado_em ?? agora,
    atualizado_em: agora,
    origem: existente?.origem ?? origem,
    empresa: empresa || existente?.empresa || logoHint?.empresa || null,
    logo_url: existente?.logo_url || logoHint?.url || null,
    vaga_titulo: titulo,
    vaga_url: vaga_url || null,
    portal: portal || null,
    segmento_slug: segmento_slug || null,
    segmento_label:
      resultado.segmento_label ??
      LABELS_SEGMENTO[segmento_slug] ??
      segmento_slug ??
      null,
    segmentacao_id: segmentacaoId,
    formato_cv: resultado.formato_gerado ?? segmentacao?.formato_cv ?? "ats",
    notas: existente?.notas ?? "",
  };

  fs.writeFileSync(caminho(base.id), `${JSON.stringify(base, null, 2)}\n`, "utf8");
  return base;
}

/** Card manual no Status (ex.: Google Forms, sem pacote). */
export function criarCandidaturaManual(input = {}) {
  const vaga_titulo = String(input.vaga_titulo ?? "").trim();
  if (!vaga_titulo) throw new Error("vaga_titulo obrigatório");

  ensureDir();
  const agora = new Date().toISOString();
  const statusRaw = String(input.status ?? "enviado").trim();
  const status = STATUS_SET.has(statusRaw) ? statusRaw : "enviado";
  const segmento_slug = String(input.segmento_slug ?? "").trim() || null;
  const vaga_url = String(input.vaga_url ?? "").trim() || null;

  if (vaga_url) {
    const existente = findCandidaturaPorVagaUrl(vaga_url);
    if (existente) {
      return atualizarCandidatura(existente.id, {
        status,
        notas: input.notas,
        empresa: input.empresa,
        vaga_titulo,
        logo_url: input.logo_url,
        segmento_slug,
        segmento_label: input.segmento_label,
      });
    }
  }

  const empresaIn = String(input.empresa ?? "").trim();
  const logoIn = String(input.logo_url ?? "").trim();
  const logoHint = resolverLogoEmpresa({
    empresa: empresaIn,
    vaga_titulo,
    vaga_url,
  });

  const base = {
    id: novoId(),
    status,
    criado_em: agora,
    atualizado_em: agora,
    origem: String(input.origem ?? "manual").trim() || "manual",
    empresa: empresaIn || logoHint?.empresa || null,
    logo_url: logoIn || logoHint?.url || null,
    vaga_titulo,
    vaga_url,
    portal: String(input.portal ?? "").trim() || null,
    segmento_slug,
    segmento_label:
      String(input.segmento_label ?? "").trim() ||
      (segmento_slug ? LABELS_SEGMENTO[segmento_slug] ?? segmento_slug : null),
    segmentacao_id: null,
    formato_cv: null,
    notas: String(input.notas ?? ""),
  };

  fs.writeFileSync(caminho(base.id), `${JSON.stringify(base, null, 2)}\n`, "utf8");
  return base;
}

export function atualizarCandidatura(id, patch = {}) {
  const atual = getCandidatura(id);
  if (!atual) return null;

  const next = { ...atual, atualizado_em: new Date().toISOString() };

  if (patch.status != null) {
    const status = String(patch.status).trim();
    if (!STATUS_SET.has(status)) throw new Error("Status inválido");
    next.status = status;
  }

  if (patch.notas != null) {
    next.notas = String(patch.notas);
  }

  if (patch.empresa != null) {
    next.empresa = String(patch.empresa).trim() || null;
  }
  if (patch.vaga_titulo != null) {
    const t = String(patch.vaga_titulo).trim();
    if (t) next.vaga_titulo = t;
  }
  if (patch.logo_url != null) {
    next.logo_url = String(patch.logo_url).trim() || null;
  }
  if (patch.segmento_slug != null) {
    const slug = String(patch.segmento_slug).trim() || null;
    next.segmento_slug = slug;
    if (patch.segmento_label != null) {
      next.segmento_label = String(patch.segmento_label).trim() || null;
    } else if (slug) {
      next.segmento_label = LABELS_SEGMENTO[slug] ?? slug;
    }
  } else if (patch.segmento_label != null) {
    next.segmento_label = String(patch.segmento_label).trim() || null;
  }

  fs.writeFileSync(caminho(id), `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

export function removerCandidatura(id) {
  const filePath = caminho(id);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}
