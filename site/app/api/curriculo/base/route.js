import { NextResponse } from "next/server";
import { getCvBase, saveCvBase } from "@/lib/dados";
import { parseCvBase } from "@/lib/cv";

export async function GET() {
  try {
    const content = getCvBase();
    return NextResponse.json({
      content,
      sections: parseCvBase(content),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível ler dados/cv-base.md", detail: err.message },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const { content } = await request.json();
    if (content === undefined || content === null) {
      return NextResponse.json({ error: "Campo content obrigatório" }, { status: 400 });
    }
    saveCvBase(content);
    const saved = getCvBase();
    return NextResponse.json({ ok: true, content: saved, sections: parseCvBase(saved) });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível salvar", detail: err.message },
      { status: 500 },
    );
  }
}
