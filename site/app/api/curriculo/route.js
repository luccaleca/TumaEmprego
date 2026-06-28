import { NextResponse } from "next/server";
import { getCurriculoAtivo } from "@/lib/dados";
import { parseCvBase } from "@/lib/cv";

export async function GET() {
  try {
    return NextResponse.json({
      base: parseCvBase(),
      ativo: getCurriculoAtivo(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível ler o currículo", detail: err.message },
      { status: 500 },
    );
  }
}
