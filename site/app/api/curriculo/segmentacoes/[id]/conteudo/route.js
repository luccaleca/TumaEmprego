import { NextResponse } from "next/server";
import { parseCvBase } from "@/lib/cv";
import { getSegmentacao, getSegmentacaoConteudo } from "@/lib/segmentacoes";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const meta = getSegmentacao(id);
    if (!meta) {
      return NextResponse.json({ error: "Segmentação não encontrada" }, { status: 404 });
    }

    const conteudo = getSegmentacaoConteudo(id);
    if (!conteudo || conteudo.formato !== "markdown") {
      return NextResponse.json({ sections: [], meta });
    }

    return NextResponse.json({
      meta,
      sections: parseCvBase(conteudo.content),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível ler conteúdo", detail: err.message },
      { status: 500 },
    );
  }
}
