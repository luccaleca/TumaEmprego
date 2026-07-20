import { NextResponse } from "next/server";
import { excluirSegmentacao, getSegmentacao } from "@/lib/segmentacoes";

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const meta = getSegmentacao(id);

    if (!meta) {
      return NextResponse.json({ error: "Versão não encontrada" }, { status: 404 });
    }

    excluirSegmentacao(id);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json(
      { error: "Não excluiu", detail: err.message },
      { status: 500 },
    );
  }
}
