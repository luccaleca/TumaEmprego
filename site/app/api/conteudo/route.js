import { NextResponse } from "next/server";
import { getConteudoBanco, getCurriculoModelo, saveConteudoBanco } from "@/lib/dados";

export async function GET() {
  try {
    return NextResponse.json({
      banco: getConteudoBanco(),
      modelo: getCurriculoModelo(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Não foi possível ler o banco de conteúdo",
        detail: err.message,
      },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const { banco } = await request.json();
    if (!banco || typeof banco !== "object") {
      return NextResponse.json({ error: "Campo banco obrigatório" }, { status: 400 });
    }
    saveConteudoBanco(banco);
    return NextResponse.json({ ok: true, banco: getConteudoBanco() });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível salvar", detail: err.message },
      { status: 500 },
    );
  }
}
