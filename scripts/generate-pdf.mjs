#!/usr/bin/env node
/**
 * Gera PDF a partir de um arquivo Markdown de currículo.
 * Uso: node scripts/generate-pdf.mjs [entrada.md] [saida.pdf]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const entrada = process.argv[2] ?? path.join(root, "dados", "cv-base.md");
const saida =
  process.argv[3] ??
  path.join(root, "dados", "curriculo", "principal.pdf");

const { gerarPdfFromMarkdown } = await import(
  pathToFileURL(path.join(root, "site", "lib", "gerarPdf.js")).href
);

if (!fs.existsSync(entrada)) {
  console.error(`Arquivo não encontrado: ${entrada}`);
  process.exit(1);
}

const markdown = fs.readFileSync(entrada, "utf8");
const buffer = await gerarPdfFromMarkdown(markdown);

fs.mkdirSync(path.dirname(saida), { recursive: true });
fs.writeFileSync(saida, buffer);

console.log(`PDF salvo em ${saida}`);
