import { NextResponse } from "next/server";
import { gerarPdfFromMarkdown } from "@/lib/gerarPdf";
import {
  getSegmentacao,
  getSegmentacaoConteudo,
  salvarSegmentacaoPdf,
  statusPdfSegmentacao,
} from "@/lib/segmentacoes";

export async function POST(_request, { params }) {
  try {
    const { id } = await params;
    const meta = getSegmentacao(id);

    if (!meta) {
      return NextResponse.json({ error: "Segmentação não encontrada" }, { status: 404 });
    }

    const conteudo = getSegmentacaoConteudo(id);
    if (!conteudo || conteudo.formato !== "markdown") {
      return NextResponse.json(
        { error: "Só é possível gerar PDF a partir de variação em Markdown" },
        { status: 400 },
      );
    }

    const buffer = await gerarPdfFromMarkdown(conteudo.content);
    const atualizado = salvarSegmentacaoPdf(id, buffer);
    const pdfStatus = statusPdfSegmentacao(id);

    return NextResponse.json({
      ok: true,
      meta: atualizado,
      pdfUrl: `/api/curriculo/segmentacoes/${id}/arquivo?v=${encodeURIComponent(pdfStatus.pdfUpdatedAt)}`,
      pdfUpdatedAt: pdfStatus.pdfUpdatedAt,
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
          : "Não gerou o PDF",
        detail,
      },
      { status: 500 },
    );
  }
}
