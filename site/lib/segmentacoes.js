import fs from "fs";
import path from "path";

import { MOTOR_CV_VERSAO } from "./adaptarCvLocal.js";
import { SEGMENTOS_CV_SLOTS } from "./conteudoConstants.js";

const DADOS_ROOT = path.join(process.cwd(), "..", "dados");
const SEG_ROOT = path.join(DADOS_ROOT, "curriculo", "segmentacoes");
const LEGADO_ADAPTADO = path.join(DADOS_ROOT, "curriculo", "adaptado-busca.md");

function metaPath(id) {
  return path.join(SEG_ROOT, id, "meta.json");
}

function dirPath(id) {
  return path.join(SEG_ROOT, id);
}

export function tituloVagaFromAlvos(alvos) {
  const lista = alvos ?? [];
  if (!lista.length) return "Segmentos";
  if (lista.length === 1) {
    return `${lista[0].senioridade} · ${lista[0].titulo}`;
  }
  return `${lista[0].senioridade} · ${lista[0].titulo} (+${lista.length - 1} alvos)`;
}

export function tituloVagaFromSegmento(segmentoNome, alvosPrimarios) {
  const lista = alvosPrimarios ?? [];
  if (!lista.length) return `Currículo · ${segmentoNome}`;
  if (lista.length === 1) {
    return `${lista[0].senioridade} · ${lista[0].titulo}`;
  }
  return `${segmentoNome} · ${lista[0].titulo} (+${lista.length - 1})`;
}

export function descricaoVagaFromPedido(pedido) {
  const linhas = [];
  const foco = pedido.alvos_primarios ?? pedido.alvos ?? [];
  const comp = pedido.alvos_complementares ?? [];

  if (foco.length) {
    linhas.push("Foco:");
    linhas.push(...foco.map((a) => `${a.senioridade} · ${a.titulo} — ${a.nicho ?? a.area}`));
  } else if (pedido.segmento?.nome) {
    linhas.push(`Foco: ${pedido.segmento.nome} (geral)`);
  }

  if (comp.length) {
    linhas.push("Complemento:");
    linhas.push(...comp.map((a) => `${a.senioridade} · ${a.titulo} — ${a.area} → ${a.nicho}`));
  }

  return linhas.join("\n");
}

/** @deprecated use descricaoVagaFromPedido */
export function descricaoVagaFromAlvos(alvos) {
  return (alvos ?? [])
    .map((a) => `${a.senioridade} · ${a.titulo} — ${a.area} → ${a.nicho}`)
    .join("\n");
}

function readMeta(id) {
  const file = metaPath(id);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function enrichMeta(meta) {
  const dir = dirPath(meta.id);
  const mdPath = path.join(dir, "curriculo.md");
  const pdfPath = path.join(dir, "curriculo.pdf");
  const hasPdf = fs.existsSync(pdfPath);
  const hasMd = fs.existsSync(mdPath);

  let updatedAt = meta.criado_em;
  try {
    const stat = fs.statSync(hasPdf ? pdfPath : mdPath);
    updatedAt = stat.mtime.toISOString();
  } catch {
    /* ignore */
  }

  return {
    ...meta,
    formato: hasPdf ? "pdf" : "markdown",
    hasPdf,
    hasMd,
    updatedAt,
  };
}

export function getSegmentacao(id) {
  const meta = readMeta(id);
  if (!meta) return null;
  return enrichMeta(meta);
}

export function listSegmentacoes() {
  if (!fs.existsSync(SEG_ROOT)) return [];
  return fs
    .readdirSync(SEG_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith("seg-"))
    .map((d) => getSegmentacao(d.name))
    .filter(Boolean)
    .sort((a, b) => String(b.criado_em).localeCompare(String(a.criado_em)));
}

export function getSegmentacaoConteudo(id) {
  const dir = dirPath(id);
  const mdPath = path.join(dir, "curriculo.md");
  const pdfPath = path.join(dir, "curriculo.pdf");
  if (fs.existsSync(mdPath)) {
    return { formato: "markdown", content: fs.readFileSync(mdPath, "utf8") };
  }
  if (fs.existsSync(pdfPath)) {
    return { formato: "pdf", path: pdfPath };
  }
  return null;
}

function idSegmentacaoValido(id) {
  return typeof id === "string" && /^seg-[a-z0-9-]+$/i.test(id);
}

export function idSlotSegmento(slug) {
  return `seg-var-${slug}`;
}

export function isSlotSegmento(meta) {
  if (!meta) return false;
  if (meta.slot === true) return true;
  const slug = meta.segmento_slug;
  return Boolean(slug && meta.id === idSlotSegmento(slug));
}

export function getSegmentacaoSlot(slug) {
  const id = idSlotSegmento(slug);
  if (!fs.existsSync(metaPath(id))) return null;
  return getSegmentacao(id);
}

export function upsertSlotSegmentacao(pedido, conteudoMd, { regenerar = false } = {}) {
  const slug = pedido?.segmento?.slug;
  if (!slug) throw new Error("segmento.slug obrigatório");

  const id = idSlotSegmento(slug);
  const dir = dirPath(id);
  const mdPath = path.join(dir, "curriculo.md");
  const exists = fs.existsSync(metaPath(id));
  const prev = exists ? readMeta(id) : null;

  const primarios = pedido.alvos_primarios ?? pedido.alvos ?? [];
  const segmentoNome = pedido.segmento?.nome ?? slug;

  const motorDesatualizado = (prev?.motor_versao ?? 0) < MOTOR_CV_VERSAO;

  const meta = {
    id,
    vaga_titulo: tituloVagaFromSegmento(segmentoNome, primarios),
    vaga_descricao: descricaoVagaFromPedido(pedido),
    origem: "segmento",
    segmento_slug: slug,
    slot: true,
    alvos: primarios,
    alvos_complementares: pedido.alvos_complementares ?? [],
    motor_versao: MOTOR_CV_VERSAO,
    criado_em: prev?.criado_em ?? new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    formato: "markdown",
  };

  fs.mkdirSync(dir, { recursive: true });

  const semConteudo = !fs.existsSync(mdPath);
  if (conteudoMd?.trim() && (regenerar || semConteudo || !exists || motorDesatualizado)) {
    fs.writeFileSync(mdPath, conteudoMd.trim());
  }

  fs.writeFileSync(metaPath(id), `${JSON.stringify(meta, null, 2)}\n`);
  return getSegmentacao(id);
}

/** Move legado (seg-* com origem busca) para slots fixos e remove duplicatas. */
export function migrarSegmentacoesParaSlots() {
  if (!fs.existsSync(SEG_ROOT)) return;

  const all = listSegmentacoes();

  for (const slug of SEGMENTOS_CV_SLOTS) {
    const slotId = idSlotSegmento(slug);
    const legados = all.filter(
      (s) =>
        s.segmento_slug === slug &&
        !isSlotSegmento(s) &&
        (s.origem === "busca" || s.origem === "segmento"),
    );

    if (!fs.existsSync(metaPath(slotId)) && legados.length) {
      const melhor = legados.sort((a, b) =>
        String(b.updatedAt ?? b.criado_em).localeCompare(String(a.updatedAt ?? a.criado_em)),
      )[0];
      const srcDir = dirPath(melhor.id);
      fs.mkdirSync(dirPath(slotId), { recursive: true });
      for (const file of ["curriculo.md", "curriculo.pdf"]) {
        const src = path.join(srcDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(dirPath(slotId), file));
        }
      }
      const meta = {
        ...readMeta(melhor.id),
        id: slotId,
        origem: "segmento",
        segmento_slug: slug,
        slot: true,
      };
      fs.writeFileSync(metaPath(slotId), `${JSON.stringify(meta, null, 2)}\n`);
    }

    for (const leg of legados) {
      if (leg.id !== slotId) {
        try {
          fs.rmSync(dirPath(leg.id), { recursive: true, force: true });
        } catch {
          /* ignore */
        }
      }
    }
  }
}

export function excluirSegmentacao(id) {
  if (!idSegmentacaoValido(id)) {
    throw new Error("ID inválido");
  }

  const meta = readMeta(id);
  if (isSlotSegmento(meta)) {
    throw new Error("Variação fixa");
  }

  const dir = dirPath(id);
  if (!fs.existsSync(dir)) {
    return false;
  }

  fs.rmSync(dir, { recursive: true, force: true });
  return true;
}

export function salvarSegmentacaoConteudo(id, content) {
  if (!idSegmentacaoValido(id)) {
    throw new Error("ID inválido");
  }

  if (!String(content ?? "").trim()) {
    throw new Error("Conteúdo vazio");
  }

  if (!fs.existsSync(metaPath(id))) {
    throw new Error("Segmentação não encontrada");
  }

  // PDF antigo pode existir — editar .md é ok; UI marca PDF desatualizado.
  const mdPath = path.join(dirPath(id), "curriculo.md");
  if (!fs.existsSync(mdPath) && fs.existsSync(path.join(dirPath(id), "curriculo.pdf"))) {
    throw new Error("Só há PDF nesta variação — não dá para editar texto");
  }

  fs.writeFileSync(mdPath, content.trim(), "utf8");
  return getSegmentacao(id);
}

export function salvarSegmentacaoPdf(id, buffer) {
  if (!idSegmentacaoValido(id)) {
    throw new Error("ID inválido");
  }

  if (!Buffer.isBuffer(buffer) || !buffer.length) {
    throw new Error("PDF inválido");
  }

  if (!fs.existsSync(metaPath(id))) {
    throw new Error("Segmentação não encontrada");
  }

  fs.writeFileSync(path.join(dirPath(id), "curriculo.pdf"), buffer);
  return getSegmentacao(id);
}

export function statusPdfSegmentacao(id) {
  const mdPath = path.join(dirPath(id), "curriculo.md");
  const pdfPath = path.join(dirPath(id), "curriculo.pdf");
  const temPdf = fs.existsSync(pdfPath);
  const temMd = fs.existsSync(mdPath);

  if (!temPdf) {
    return { temPdf: false, desatualizado: false, pdfUpdatedAt: null };
  }

  const pdfUpdatedAt = fs.statSync(pdfPath).mtime.toISOString();
  const desatualizado = temMd && fs.statSync(mdPath).mtimeMs > fs.statSync(pdfPath).mtimeMs;

  return { temPdf: true, desatualizado, pdfUpdatedAt };
}

export function salvarPacoteSolides(id, pacote, previewMd = null) {
  if (!idSegmentacaoValido(id)) {
    throw new Error("ID inválido");
  }
  if (!fs.existsSync(metaPath(id))) {
    throw new Error("Segmentação não encontrada");
  }

  const dir = dirPath(id);
  fs.writeFileSync(path.join(dir, "solides-pacote.json"), `${JSON.stringify(pacote, null, 2)}\n`, "utf8");
  if (previewMd?.trim()) {
    fs.writeFileSync(path.join(dir, "solides-preview.md"), previewMd.trim(), "utf8");
  }
  return getPacoteSolides(id);
}

export function getPacoteSolides(id) {
  if (!idSegmentacaoValido(id)) return null;

  const dir = dirPath(id);
  const jsonPath = path.join(dir, "solides-pacote.json");
  if (!fs.existsSync(jsonPath)) return null;

  const pacote = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const mdPath = path.join(dir, "solides-preview.md");
  const preview = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, "utf8") : null;

  return { pacote, preview };
}

export function atualizarMetaSegmentacao(id, patch) {
  if (!idSegmentacaoValido(id)) {
    throw new Error("ID inválido");
  }

  const meta = readMeta(id);
  if (!meta) {
    throw new Error("Segmentação não encontrada");
  }

  const atualizado = {
    ...meta,
    ...patch,
    atualizado_em: new Date().toISOString(),
  };

  fs.writeFileSync(metaPath(id), `${JSON.stringify(atualizado, null, 2)}\n`, "utf8");
  return getSegmentacao(id);
}

export function criarSegmentacao({
  vaga_titulo,
  vaga_empresa = null,
  vaga_descricao = "",
  vaga_url = null,
  origem = "manual",
  segmento_slug = null,
  alvos = [],
  alvos_complementares = [],
  conteudoMd,
  pdfBuffer,
  portal = null,
  formato_cv = null,
  motor_solides_versao = null,
}) {
  if (!vaga_titulo?.trim()) {
    throw new Error("vaga_titulo obrigatório");
  }
  if (!conteudoMd?.trim() && !pdfBuffer?.length) {
    throw new Error("Arquivo ou conteúdo obrigatório");
  }

  const id = `seg-${Date.now().toString(36)}`;
  const dir = dirPath(id);
  fs.mkdirSync(dir, { recursive: true });

  const meta = {
    id,
    vaga_titulo: vaga_titulo.trim(),
    vaga_descricao: String(vaga_descricao ?? "").trim(),
    origem,
    segmento_slug,
    alvos,
    alvos_complementares,
    criado_em: new Date().toISOString(),
    formato: pdfBuffer?.length ? "pdf" : "markdown",
    ...(vaga_empresa?.trim() ? { vaga_empresa: String(vaga_empresa).trim() } : {}),
    ...(vaga_url ? { vaga_url: String(vaga_url).trim() } : {}),
    ...(portal ? { portal } : {}),
    ...(formato_cv ? { formato_cv } : {}),
    ...(motor_solides_versao ? { motor_solides_versao } : {}),
  };

  if (pdfBuffer?.length) {
    fs.writeFileSync(path.join(dir, "curriculo.pdf"), pdfBuffer);
  } else {
    fs.writeFileSync(path.join(dir, "curriculo.md"), conteudoMd.trim());
  }

  fs.writeFileSync(metaPath(id), `${JSON.stringify(meta, null, 2)}\n`, "utf8");
  return getSegmentacao(id);
}

function normalizeUrlVaga(url) {
  return String(url ?? "")
    .trim()
    .replace(/\/+$/, "")
    .toLowerCase();
}

function normalizeTituloVaga(titulo) {
  return String(titulo ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

/**
 * Encontra CV de vaga já gerado (evita duplicar no clique duplo / retry).
 * Prioriza URL; senão título+segmento nos últimos 10 min.
 */
export function encontrarSegmentacaoVagaExistente({
  vaga_url,
  vaga_titulo,
  segmento_slug,
  portal = null,
  formato_cv = null,
} = {}) {
  const urlN = normalizeUrlVaga(vaga_url);
  const tituloN = normalizeTituloVaga(vaga_titulo);
  const slug = String(segmento_slug ?? "").trim() || null;
  const portalN = portal ? String(portal).trim().toLowerCase() : null;
  const formatoN = formato_cv ? String(formato_cv).trim().toLowerCase() : null;
  const agora = Date.now();
  const JANELA_MS = 10 * 60 * 1000;

  const candidatas = listSegmentacoes().filter((s) => {
    if (s.origem !== "vaga" || isSlotSegmento(s)) return false;
    if (portalN && String(s.portal ?? "").toLowerCase() !== portalN) return false;
    if (formatoN) {
      const sFmt = String(
        s.formato_cv ?? (s.portal === "solides" ? "solides" : "ats"),
      ).toLowerCase();
      if (sFmt !== formatoN) return false;
    }
    return true;
  });

  if (urlN) {
    const porUrl = candidatas.find((s) => normalizeUrlVaga(s.vaga_url) === urlN);
    if (porUrl) return porUrl;
  }

  if (!tituloN) return null;

  return (
    candidatas.find((s) => {
      if (normalizeTituloVaga(s.vaga_titulo) !== tituloN) return false;
      if (slug && s.segmento_slug && s.segmento_slug !== slug) return false;
      const criado = Date.parse(s.atualizado_em || s.criado_em || 0);
      if (!Number.isFinite(criado)) return false;
      return agora - criado < JANELA_MS;
    }) ?? null
  );
}

/** Cria CV de vaga ou sobrescreve o existente (mesma URL / retry recente). */
export function criarOuAtualizarSegmentacaoVaga(opts) {
  const existente = encontrarSegmentacaoVagaExistente({
    vaga_url: opts.vaga_url,
    vaga_titulo: opts.vaga_titulo,
    segmento_slug: opts.segmento_slug,
    portal: opts.portal,
    formato_cv: opts.formato_cv ?? (opts.portal === "solides" ? "solides" : "ats"),
  });

  if (!existente) {
    return criarSegmentacao({
      ...opts,
      origem: "vaga",
      formato_cv: opts.formato_cv ?? (opts.portal === "solides" ? "solides" : "ats"),
    });
  }

  if (opts.conteudoMd?.trim()) {
    salvarSegmentacaoConteudo(existente.id, opts.conteudoMd);
  }

  return atualizarMetaSegmentacao(existente.id, {
    vaga_titulo: String(opts.vaga_titulo ?? existente.vaga_titulo).trim(),
    vaga_descricao: String(opts.vaga_descricao ?? "").trim(),
    origem: "vaga",
    segmento_slug: opts.segmento_slug ?? existente.segmento_slug,
    ...(opts.vaga_empresa?.trim()
      ? { vaga_empresa: String(opts.vaga_empresa).trim() }
      : {}),
    ...(opts.vaga_url ? { vaga_url: String(opts.vaga_url).trim() } : {}),
    ...(opts.portal ? { portal: opts.portal } : {}),
    ...(opts.formato_cv || opts.portal === "solides"
      ? { formato_cv: opts.formato_cv ?? (opts.portal === "solides" ? "solides" : "ats") }
      : { formato_cv: "ats" }),
    ...(opts.motor_solides_versao
      ? { motor_solides_versao: opts.motor_solides_versao }
      : {}),
    formato: "markdown",
  });
}

export function migrarAdaptadoBuscaLegado() {
  if (!fs.existsSync(LEGADO_ADAPTADO)) return null;

  const jaExiste = listSegmentacoes().some((s) => s.origem === "busca");
  if (jaExiste) return null;

  const pedidoPath = path.join(DADOS_ROOT, "curriculo", "pedido-adaptacao.json");
  let alvos = [];
  if (fs.existsSync(pedidoPath)) {
    try {
      const pedido = JSON.parse(fs.readFileSync(pedidoPath, "utf8"));
      alvos = pedido.alvos ?? [];
    } catch {
      alvos = [];
    }
  }

  const content = fs.readFileSync(LEGADO_ADAPTADO, "utf8");
  const seg = criarSegmentacao({
    vaga_titulo: tituloVagaFromAlvos(alvos) || "CV adaptado (busca)",
    vaga_descricao: descricaoVagaFromAlvos(alvos),
    origem: "busca",
    alvos,
    conteudoMd: content,
  });

  fs.unlinkSync(LEGADO_ADAPTADO);
  return seg;
}
