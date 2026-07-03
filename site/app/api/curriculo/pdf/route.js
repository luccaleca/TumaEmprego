import { NextResponse } from "next/server";
import fs from "fs";
import { getCvBase, getCurriculoArquivo, saveCurriculoPdf } from "@/lib/dados";
import { gerarPdfFromMarkdown, compararMdPdf } from "@/lib/gerarPdf";
import path from "path";

const DADOS_ROOT = path.join(process.cwd(), "..", "dados");
const CV_BASE = path.join(DADOS_ROOT, "cv-base.md");
const PDF_PRINCIPAL = path.join(DADOS_ROOT, "curriculo", "principal.pdf");

export async function POST() {
  try {
    const content = getCvBase();
    if (!content?.trim()) {
      return NextResponse.json({ error: "cv-base.md vazio" }, { status: 400 });
    }

    const buffer = await gerarPdfFromMarkdown(content);
    saveCurriculoPdf(buffer);

    const arquivo = getCurriculoArquivo();
    const pdfStatus = compararMdPdf(CV_BASE, PDF_PRINCIPAL);

    return NextResponse.json({
      ok: true,
      file: arquivo,
      pdfUrl: `/api/curriculo/arquivo?v=${encodeURIComponent(arquivo.updatedAt)}`,
      desatualizado: pdfStatus.desatualizado,
    });
  } catch (err) {
    const detail = err.message ?? "Erro desconhecido";
    const playwrightMissing =
      detail.includes("playwright") ||
      detail.includes("Executable doesn't exist") ||
      detail.includes("browserType.launch");

    return NextResponse.json(
      {
        error: playwrightMissing
          ? "Playwright não instalado — rode: npx playwright install chromium"
          : "Não foi possível gerar PDF",
        detail,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  if (!fs.existsSync(CV_BASE)) {
    return NextResponse.json({ temPdf: false, desatualizado: false });
  }

  const pdfStatus = compararMdPdf(CV_BASE, PDF_PRINCIPAL);
  const arquivo = getCurriculoArquivo();

  return NextResponse.json({
    ...pdfStatus,
    pdfUrl: arquivo
      ? `/api/curriculo/arquivo?v=${encodeURIComponent(arquivo.updatedAt)}`
      : null,
  });
}
