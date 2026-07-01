import fs from "fs";
import { NextResponse } from "next/server";
import { getSegmentacao, getSegmentacaoConteudo } from "@/lib/segmentacoes";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const meta = getSegmentacao(id);
    if (!meta) {
      return NextResponse.json({ error: "Segmentação não encontrada" }, { status: 404 });
    }

    const conteudo = getSegmentacaoConteudo(id);
    if (!conteudo) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
    }

    if (conteudo.formato === "pdf") {
      const buffer = fs.readFileSync(conteudo.path);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="curriculo-${id}.pdf"`,
        },
      });
    }

    return NextResponse.json({
      formato: "markdown",
      content: conteudo.content,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível ler o arquivo", detail: err.message },
      { status: 500 },
    );
  }
}
