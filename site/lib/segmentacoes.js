import fs from "fs";
import path from "path";

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

export function getSegmentacaoPdfPath(id) {
  const pdfPath = path.join(dirPath(id), "curriculo.pdf");
  return fs.existsSync(pdfPath) ? pdfPath : null;
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

  const meta = {
    id,
    vaga_titulo: tituloVagaFromSegmento(segmentoNome, primarios),
    vaga_descricao: descricaoVagaFromPedido(pedido),
    origem: "segmento",
    segmento_slug: slug,
    slot: true,
    alvos: primarios,
    alvos_complementares: pedido.alvos_complementares ?? [],
    criado_em: prev?.criado_em ?? new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    formato: "markdown",
  };

  fs.mkdirSync(dir, { recursive: true });

  const semConteudo = !fs.existsSync(mdPath);
  if (conteudoMd?.trim() && (regenerar || semConteudo || !exists)) {
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

function ordemSegmentacao(a, b) {
  const ia = SEGMENTOS_CV_SLOTS.indexOf(a.segmento_slug);
  const ib = SEGMENTOS_CV_SLOTS.indexOf(b.segmento_slug);
  if (ia >= 0 && ib >= 0) return ia - ib;
  if (ia >= 0) return -1;
  if (ib >= 0) return 1;
  return String(b.criado_em).localeCompare(String(a.criado_em));
}

/** Slots de segmento visíveis + variações extras (vaga / manual). */
export function listSegmentacoesVisiveis(segmentosAtivos = []) {
  migrarSegmentacoesParaSlots();
  const ativos = new Set(segmentosAtivos ?? []);
  const all = listSegmentacoes();

  return all
    .filter((seg) => {
      if (isSlotSegmento(seg)) {
        return ativos.has(seg.segmento_slug);
      }
      if (seg.origem === "vaga" || seg.origem === "manual") {
        return true;
      }
      return false;
    })
    .sort(ordemSegmentacao);
}

export function excluirSegmentacao(id) {
  if (!idSegmentacaoValido(id)) {
    throw new Error("ID inválido");
  }

  const meta = readMeta(id);
  if (isSlotSegmento(meta)) {
    throw new Error(
      "Variação fixa do segmento — desmarque a área em Segmentos para ocultar, em vez de excluir",
    );
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

  const pdfPath = path.join(dirPath(id), "curriculo.pdf");
  if (fs.existsSync(pdfPath)) {
    throw new Error("Variação em PDF — substitua o arquivo para editar por texto");
  }

  fs.writeFileSync(path.join(dirPath(id), "curriculo.md"), content.trim(), "utf8");
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

export function criarSegmentacao({
  vaga_titulo,
  vaga_descricao = "",
  origem = "manual",
  segmento_slug = null,
  alvos = [],
  alvos_complementares = [],
  conteudoMd,
  pdfBuffer,
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
  };

  if (pdfBuffer?.length) {
    fs.writeFileSync(path.join(dir, "curriculo.pdf"), pdfBuffer);
  } else {
    fs.writeFileSync(path.join(dir, "curriculo.md"), conteudoMd.trim());
  }

  fs.writeFileSync(metaPath(id), `${JSON.stringify(meta, null, 2)}\n`, "utf8");
  return getSegmentacao(id);
}

export function criarSegmentacaoFromPedido(pedido, conteudoMd) {
  const primarios = pedido.alvos_primarios ?? pedido.alvos ?? [];
  const complementares = pedido.alvos_complementares ?? [];
  const segmentoNome = pedido.segmento?.nome ?? "Segmento";

  return criarSegmentacao({
    vaga_titulo: tituloVagaFromSegmento(segmentoNome, primarios),
    vaga_descricao: descricaoVagaFromPedido(pedido),
    origem: "busca",
    segmento_slug: pedido.segmento?.slug ?? null,
    alvos: primarios,
    alvos_complementares: complementares,
    conteudoMd,
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
