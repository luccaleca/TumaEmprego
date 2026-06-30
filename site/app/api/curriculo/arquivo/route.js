import { NextResponse } from "next/server";
import fs from "fs";
import { getCurriculoPdfPath } from "@/lib/dados";

export async function GET() {
  try {
    const filePath = getCurriculoPdfPath();
    if (!filePath) {
      return NextResponse.json({ error: "Nenhum PDF encontrado" }, { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="principal.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível abrir o PDF", detail: err.message },
      { status: 500 },
    );
  }
}
