import { NextResponse } from "next/server";
import { getCvBase, saveCvBase } from "@/lib/dados";
import { parseCvDocument, sectionsForDisplay, cleanPreambleForExport } from "@/lib/cv";

export async function GET() {
  try {
    const content = getCvBase();
    const { preamble, sections } = parseCvDocument(content);
    return NextResponse.json({
      content,
      preamble: cleanPreambleForExport(preamble),
      sections: sectionsForDisplay(sections),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não leu o currículo base", detail: err.message },
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
    const parsed = parseCvDocument(saved);
    return NextResponse.json({
      ok: true,
      content: saved,
      preamble: cleanPreambleForExport(parsed.preamble),
      sections: sectionsForDisplay(parsed.sections),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não salvou", detail: err.message },
      { status: 500 },
    );
  }
}
