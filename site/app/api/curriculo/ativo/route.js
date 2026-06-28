import { NextResponse } from "next/server";
import { getCurriculoAtivo, saveCurriculoAtivo } from "@/lib/dados";

export async function PUT(request) {
  try {
    const { ativo } = await request.json();
    if (!ativo) {
      return NextResponse.json({ error: "Campo ativo obrigatório" }, { status: 400 });
    }

    const payload = {
      ...ativo,
      nota: ativo.nota === "" || ativo.nota === null ? "" : Number(ativo.nota),
    };

    if (payload.nota !== "" && Number.isNaN(payload.nota)) {
      return NextResponse.json({ error: "Nota inválida" }, { status: 400 });
    }

    saveCurriculoAtivo(payload);
    return NextResponse.json({ ok: true, ativo: getCurriculoAtivo() });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível salvar", detail: err.message },
      { status: 500 },
    );
  }
}
