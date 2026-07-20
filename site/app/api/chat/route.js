import { NextResponse } from "next/server";
import { responderPerguntaCandidato } from "@/lib/chatCandidato";

export async function POST(request) {
  try {
    const body = await request.json();
    const pergunta = String(body?.pergunta ?? body?.message ?? "").trim();
    const resultado = responderPerguntaCandidato({
      pergunta,
      vaga_titulo: body?.vaga_titulo,
      vaga_descricao: body?.vaga_descricao,
    });

    if (resultado.status === "erro") {
      return NextResponse.json({ error: resultado.texto }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      texto: resultado.texto,
      fonte: resultado.fonte,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não respondeu", detail: err.message },
      { status: 500 },
    );
  }
}
