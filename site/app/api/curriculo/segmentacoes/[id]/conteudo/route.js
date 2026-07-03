import { NextResponse } from "next/server";
import { parseCvBase } from "@/lib/cv";
import {
  getSegmentacao,
  getSegmentacaoConteudo,
  salvarSegmentacaoConteudo,
  statusPdfSegmentacao,
} from "@/lib/segmentacoes";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const meta = getSegmentacao(id);
    if (!meta) {
      return NextResponse.json({ error: "Segmentação não encontrada" }, { status: 404 });
    }

    const conteudo = getSegmentacaoConteudo(id);
    if (!conteudo || conteudo.formato !== "markdown") {
      return NextResponse.json({ sections: [], content: null, meta, editavel: false });
    }

    return NextResponse.json({
      meta,
      content: conteudo.content,
      sections: parseCvBase(conteudo.content),
      editavel: true,
      pdf: statusPdfSegmentacao(id),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível ler conteúdo", detail: err.message },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { content } = await request.json();

    if (content === undefined || content === null) {
      return NextResponse.json({ error: "Campo content obrigatório" }, { status: 400 });
    }

    const meta = salvarSegmentacaoConteudo(id, content);
    const saved = getSegmentacaoConteudo(id);

    return NextResponse.json({
      meta,
      content: saved.content,
      sections: parseCvBase(saved.content),
    });
  } catch (err) {
    const status = err.message.includes("não encontrada") ? 404 : 400;
    return NextResponse.json(
      { error: "Não foi possível salvar", detail: err.message },
      { status },
    );
  }
}
