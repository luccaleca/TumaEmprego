import { NextResponse } from "next/server";
import { gerarPdfFromHtml } from "@/lib/gerarPdf";
import { getPacoteSolides, getSegmentacao } from "@/lib/segmentacoes";
import { buildSolidesVagasFormHtml } from "@/lib/solidesVagasPdf";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const meta = getSegmentacao(id);
    if (!meta) {
      return NextResponse.json({ error: "Segmentação não encontrada" }, { status: 404 });
    }

    const salvo = getPacoteSolides(id);
    if (!salvo?.pacote) {
      return NextResponse.json(
        { error: "Pacote Sólides ainda não gerado para esta vaga" },
        { status: 404 },
      );
    }

    const html = buildSolidesVagasFormHtml({
      pacote: salvo.pacote,
      vazio: false,
      titulo: "Sólides Vagas",
    });
    const buffer = await gerarPdfFromHtml(html);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Curriculo.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível gerar PDF Sólides", detail: err.message },
      { status: 500 },
    );
  }
}
