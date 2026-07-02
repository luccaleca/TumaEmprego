import { NextResponse } from "next/server";
import { parseCvBase } from "@/lib/cv";
import { criarSegmentacao, listSegmentacoes, migrarAdaptadoBuscaLegado } from "@/lib/segmentacoes";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = [".pdf", ".md", ".txt", ".markdown"];

function extension(name) {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

function tituloFromFile(name) {
  const base = name.replace(/\.[^.]+$/, "").trim();
  return base || "Currículo";
}

export async function GET() {
  try {
    migrarAdaptadoBuscaLegado();
    const segmentacoes = listSegmentacoes();
    return NextResponse.json({ segmentacoes });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível listar segmentações", detail: err.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const vagaTituloInput = String(formData.get("vaga_titulo") ?? "").trim();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
    }

    const vagaTitulo = vagaTituloInput || tituloFromFile(file.name);

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

    let segmentacao;

    if (ext === ".pdf") {
      segmentacao = criarSegmentacao({
        vaga_titulo: vagaTitulo,
        origem: "manual",
        pdfBuffer: buffer,
      });
    } else {
      const content = buffer.toString("utf8").trim();
      if (!content) {
        return NextResponse.json({ error: "Arquivo vazio" }, { status: 400 });
      }
      segmentacao = criarSegmentacao({
        vaga_titulo: vagaTitulo,
        origem: "manual",
        conteudoMd: content,
      });
    }

    const conteudo = ext === ".pdf" ? null : buffer.toString("utf8");
    const sections = conteudo ? parseCvBase(conteudo) : [];

    return NextResponse.json({ ok: true, segmentacao, sections });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Não foi possível criar segmentação", detail: err.message },
      { status: 500 },
    );
  }
}
