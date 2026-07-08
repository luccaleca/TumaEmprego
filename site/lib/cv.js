import fs from "fs";
import path from "path";

const DADOS_ROOT = path.join(process.cwd(), "..", "dados");

function splitCvParts(raw) {
  const cleaned = String(raw ?? "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
  return cleaned.split(/^## /m);
}

/** Linha que existe só para o Tuma Emprego — não pode ir para PDF nem visualização do CV. */
export function isPlatformOnlyCvLine(line) {
  const trimmed = String(line ?? "").trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("<!--") || trimmed.endsWith("-->")) return true;
  if (/^\*\*Cargo-alvo\s*\(base\):\*\*/i.test(trimmed)) return true;
  if (/^\*\*(Ramificações|Stack\s*\(visão geral\)|Áreas|Foco)(\s|\()/i.test(trimmed)) return true;
  if (
    /^> /.test(trimmed) &&
    /fonte única|versão adaptada|estrutura ATS|derivada do cv-base|reúne todos os fatos|motor monta/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  if (/fonte; versões por segmento|este arquivo é a fonte|fonte única da verdade/i.test(trimmed)) {
    return true;
  }
  return false;
}

export function cleanPreambleForExport(preamble) {
  return String(preamble ?? "")
    .split("\n")
    .filter((line) => !isPlatformOnlyCvLine(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseCvDocument(raw) {
  const parts = splitCvParts(raw);
  const preamble = parts[0]?.trim() ?? "";
  const sections = [];

  for (const part of parts.slice(1)) {
    const newline = part.indexOf("\n");
    const title = part.slice(0, newline).trim();
    const body = part.slice(newline + 1).trim();
    if (title) sections.push({ title, body });
  }

  return { preamble, sections };
}

/** Remove metadados internos da seção Resumo na exibição. */
export function cleanResumoBody(body) {
  return String(body ?? "")
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (/^\*\*(Stack|Ramificações|Áreas|Foco)(\s|\()/i.test(trimmed)) return false;
      if (/fonte; versões por segmento|fonte única da verdade|este arquivo é a fonte/i.test(trimmed)) {
        return false;
      }
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sectionsForDisplay(sections) {
  return sections
    .map((section) =>
      section.title === "Resumo"
        ? { ...section, body: cleanResumoBody(section.body) }
        : section,
    )
    .filter((section) => String(section.body ?? "").trim());
}

/** Remove metadados internos antes de gerar PDF. */
export function sanitizarMarkdownCvParaExport(raw) {
  const withoutComments = String(raw ?? "").replace(/<!--[\s\S]*?-->/g, "").trim();
  const parts = withoutComments.split(/^## /m);
  const preamble = cleanPreambleForExport(parts[0]?.trim() ?? "");
  const sections = parts.slice(1).map((part) => {
    const nl = part.indexOf("\n");
    const title = part.slice(0, nl).trim();
    let body = part.slice(nl + 1).trim();
    if (title === "Resumo") body = cleanResumoBody(body);
    return { title, body };
  });

  const body = sections
    .filter((section) => section.title)
    .map((section) => `## ${section.title}\n\n${section.body}`)
    .join("\n\n");

  return preamble ? `${preamble}\n\n${body}`.trim() : body.trim();
}

export function parseCvBase(raw) {
  return parseCvDocument(raw).sections;
}

export function getCvBaseRaw() {
  const filePath = path.join(DADOS_ROOT, "cv-base.md");
  return fs.readFileSync(filePath, "utf8");
}
