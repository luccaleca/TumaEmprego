import { NextResponse } from "next/server";
import { getCurriculoPdfPath } from "@/lib/dados";
import { renderPdfFileFirstPagePng, renderPdfFirstPagePng } from "@/lib/pdfThumb";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const WIDTH = 240;

function pngResponse(buffer) {
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  try {
    const filePath = getCurriculoPdfPath();
    if (!filePath) {
      return NextResponse.json({ error: "Nenhum PDF encontrado" }, { status: 404 });
    }

    const png = await renderPdfFileFirstPagePng(filePath, WIDTH);
    return pngResponse(png);
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível gerar a prévia", detail: err.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Envie um PDF" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ error: "Arquivo acima de 10 MB" }, { status: 413 });
    }

    const png = await renderPdfFirstPagePng(buffer, WIDTH);
    return pngResponse(png);
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível gerar a prévia", detail: err.message },
      { status: 500 },
    );
  }
}
