import { NextResponse } from "next/server";
import { getTecnologias, saveTecnologias } from "@/lib/dados";

export async function GET() {
  try {
    return NextResponse.json({ tecnologias: getTecnologias() });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível ler dados/config/tecnologias.yml", detail: err.message },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const { tecnologias } = await request.json();
    if (!tecnologias) {
      return NextResponse.json({ error: "Campo tecnologias obrigatório" }, { status: 400 });
    }
    saveTecnologias(tecnologias);
    return NextResponse.json({ ok: true, tecnologias: getTecnologias() });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível salvar", detail: err.message },
      { status: 500 },
    );
  }
}
