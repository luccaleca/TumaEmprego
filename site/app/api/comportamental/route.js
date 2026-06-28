import { NextResponse } from "next/server";
import { getComportamental, saveComportamental } from "@/lib/dados";

export async function GET() {
  try {
    return NextResponse.json({ comportamental: getComportamental() });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Não foi possível ler dados/respostas/comportamental.yml",
        detail: err.message,
      },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const { comportamental } = await request.json();
    if (!comportamental) {
      return NextResponse.json(
        { error: "Campo comportamental obrigatório" },
        { status: 400 },
      );
    }
    saveComportamental(comportamental);
    return NextResponse.json({ ok: true, comportamental: getComportamental() });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível salvar", detail: err.message },
      { status: 500 },
    );
  }
}
