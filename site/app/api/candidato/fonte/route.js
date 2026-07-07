import { NextResponse } from "next/server";
import { getFonteCandidato, montarContextoFonteParaPrompt } from "@/lib/fonteCandidato";

export async function GET() {
  try {
    const fonte = getFonteCandidato();
    return NextResponse.json({
      fonte,
      contexto_prompt: montarContextoFonteParaPrompt(fonte),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível carregar a fonte do candidato", detail: err.message },
      { status: 500 },
    );
  }
}
