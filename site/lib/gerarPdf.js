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
  return gerarPdfFromHtml(html);
}

export async function gerarPdfFromHtml(html) {
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
