import fs from "fs";
import path from "path";

const DADOS_ROOT = path.join(process.cwd(), "..", "dados");

export function parseCvBase() {
  const filePath = path.join(DADOS_ROOT, "cv-base.md");
  const raw = fs.readFileSync(filePath, "utf8");

  const sections = [];
  const parts = raw.split(/^## /m);

  for (const part of parts.slice(1)) {
    const newline = part.indexOf("\n");
    const title = part.slice(0, newline).trim();
    const body = part.slice(newline + 1).trim();
    if (title) sections.push({ title, body });
  }

  return sections;
}

export function getCvBaseRaw() {
  const filePath = path.join(DADOS_ROOT, "cv-base.md");
  return fs.readFileSync(filePath, "utf8");
}
