import { NextResponse } from "next/server";
import { getPacoteSolides, getSegmentacao } from "@/lib/segmentacoes";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const meta = getSegmentacao(id);
    if (!meta) {
      return NextResponse.json({ error: "Segmentação não encontrada" }, { status: 404 });
    }

    const salvo = getPacoteSolides(id);
    if (!salvo) {
      return NextResponse.json(
        { error: "Pacote Sólides ainda não gerado para esta vaga", meta },
        { status: 404 },
      );
    }

    return NextResponse.json({
      meta,
      portal: "solides",
      solides: salvo.pacote,
      preview: salvo.preview,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível ler pacote Sólides", detail: err.message },
      { status: 500 },
    );
  }
}
