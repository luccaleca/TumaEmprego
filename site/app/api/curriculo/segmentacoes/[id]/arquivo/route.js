import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getSegmentacao } from "@/lib/segmentacoes";

const SEG_ROOT = path.join(process.cwd(), "..", "dados", "curriculo", "segmentacoes");

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const meta = getSegmentacao(id);
    if (!meta) {
      return NextResponse.json({ error: "Segmentação não encontrada" }, { status: 404 });
    }

    const dir = path.join(SEG_ROOT, id);
    const pdfPath = path.join(dir, "curriculo.pdf");
    const mdPath = path.join(dir, "curriculo.md");

    // Esta rota serve o arquivo baixável/visualizável — PDF tem prioridade
    if (fs.existsSync(pdfPath)) {
      const buffer = fs.readFileSync(pdfPath);
      const baixar = request.nextUrl.searchParams.get("download") === "1";
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": baixar
            ? `attachment; filename="Curriculo.pdf"`
            : `inline; filename="Curriculo.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (fs.existsSync(mdPath)) {
      return NextResponse.json({
        formato: "markdown",
        content: fs.readFileSync(mdPath, "utf8"),
      });
    }

    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  } catch (err) {
    return NextResponse.json(
      { error: "Não leu o arquivo", detail: err.message },
      { status: 500 },
    );
  }
}
