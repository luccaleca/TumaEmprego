import { NextResponse } from "next/server";
import { executarBuscaVagas, lerRelatorioBusca } from "@/lib/buscarVagas";
import { PORTAIS_BUSCA_IDS } from "@/lib/buscaPortais";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  try {
    const relatorio = lerRelatorioBusca();
    return NextResponse.json(relatorio ?? { vagas: [], gerado_em: null });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Não leu o relatório" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const portais = Array.isArray(body.portais) ? body.portais : PORTAIS_BUSCA_IDS;
    const relatorio = await executarBuscaVagas({
      portais,
      maxPorConsulta: body.maxPorConsulta,
      soElegiveis: Boolean(body.soElegiveis),
    });
    return NextResponse.json(relatorio);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Não buscou vagas" },
      { status: 400 },
    );
  }
}
