import fs from "fs";
import { buildCvHtml } from "./markdownCvHtml.js";
import { sanitizarMarkdownCvParaExport } from "./cv.js";

let browserPromise = null;

async function getBrowser() {
  if (!browserPromise) {
    const { chromium } = await import("playwright");
    browserPromise = chromium.launch({ headless: true });
  }
  return browserPromise;
}

export async function gerarPdfFromMarkdown(markdown) {
  const html = buildCvHtml(sanitizarMarkdownCvParaExport(markdown));
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "load" });
    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(buffer);
  } finally {
    await page.close();
  }
}

export function compararMdPdf(mdPath, pdfPath) {
  if (!fs.existsSync(mdPath)) return { temPdf: false, desatualizado: false };
  if (!fs.existsSync(pdfPath)) return { temPdf: false, desatualizado: false };
  return {
    temPdf: true,
    desatualizado: fs.statSync(mdPath).mtimeMs > fs.statSync(pdfPath).mtimeMs,
    pdfUpdatedAt: fs.statSync(pdfPath).mtime.toISOString(),
  };
}
