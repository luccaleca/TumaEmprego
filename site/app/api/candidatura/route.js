import { NextResponse } from "next/server";
import { getRespostasPadrao, saveRespostasPadrao } from "@/lib/dados";

export async function GET() {
  try {
    return NextResponse.json({ candidatura: getRespostasPadrao() });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível ler dados/respostas/padrao.yml", detail: err.message },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const { candidatura } = await request.json();
    if (!candidatura) {
      return NextResponse.json({ error: "Campo candidatura obrigatório" }, { status: 400 });
    }
    saveRespostasPadrao(candidatura);
    return NextResponse.json({ ok: true, candidatura: getRespostasPadrao() });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível salvar", detail: err.message },
      { status: 500 },
    );
  }
}
