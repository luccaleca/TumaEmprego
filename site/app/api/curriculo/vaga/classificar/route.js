import { NextResponse } from "next/server";
import { classificarVaga } from "@/lib/adaptarCvVaga";

export async function POST(request) {
  try {
    const body = await request.json();
    const vaga_descricao = String(body?.vaga_descricao ?? "").trim();
    const vaga_titulo = String(body?.vaga_titulo ?? "").trim();

    if (vaga_descricao.length < 20) {
      return NextResponse.json(
        { error: "Descrição da vaga curta demais (mínimo 20 caracteres)" },
        { status: 400 },
      );
    }

    const resultado = classificarVaga({ vaga_titulo, vaga_descricao });

    if (resultado.status === "erro") {
      return NextResponse.json({ error: "Descrição da vaga inválida" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, ...resultado });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Erro ao classificar vaga", detail: err.message },
      { status: 500 },
    );
  }
}
