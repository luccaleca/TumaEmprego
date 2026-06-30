import { NextResponse } from "next/server";
import {
  getCurriculoArquivo,
  saveCurriculoPdf,
  saveCvBase,
  getCvBase,
} from "@/lib/dados";
import { parseCvBase } from "@/lib/cv";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = [".pdf", ".md", ".txt", ".markdown"];

function extension(name) {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
    }

    const ext = extension(file.name);
    if (!ALLOWED.includes(ext)) {
      return NextResponse.json(
        { error: "Use PDF, Markdown (.md) ou texto (.txt)" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ error: "Arquivo acima de 10 MB" }, { status: 413 });
    }

    if (ext === ".pdf") {
      saveCurriculoPdf(buffer);
      return NextResponse.json({
        ok: true,
        type: "pdf",
        file: getCurriculoArquivo(),
      });
    }

    const content = buffer.toString("utf8").trim();
    if (!content) {
      return NextResponse.json({ error: "Arquivo vazio" }, { status: 400 });
    }

    saveCvBase(content);
    const saved = getCvBase();

    return NextResponse.json({
      ok: true,
      type: "markdown",
      content: saved,
      sections: parseCvBase(saved),
      file: getCurriculoArquivo(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível enviar o arquivo", detail: err.message },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json({ file: getCurriculoArquivo() });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível ler o arquivo", detail: err.message },
      { status: 500 },
    );
  }
}
