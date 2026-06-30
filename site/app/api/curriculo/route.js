import { NextResponse } from "next/server";
import { getCurriculoAtivo, getCvBase } from "@/lib/dados";
import { parseCvBase } from "@/lib/cv";

export async function GET() {
  try {
    return NextResponse.json({
      base: parseCvBase(getCvBase()),
      ativo: getCurriculoAtivo(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível ler o currículo", detail: err.message },
      { status: 500 },
    );
  }
}
