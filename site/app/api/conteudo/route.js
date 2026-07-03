import { NextResponse } from "next/server";
import { getConteudoBanco, getCurriculoModelo, saveConteudoBanco } from "@/lib/dados";
import { podarBancoPorSegmentosAtivos, resolverSegmentosAtivos } from "@/lib/segmentosAtivos";
import { getVagaCatalogo } from "@/lib/vagaCatalogo";

export async function GET() {
  try {
    const catalogo = await getVagaCatalogo();
    const segmentosAtivos = resolverSegmentosAtivos(catalogo);

    return NextResponse.json({
      banco: getConteudoBanco(),
      modelo: getCurriculoModelo(),
      segmentosAtivos,
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

    const podado = podarBancoPorSegmentosAtivos(banco);
    saveConteudoBanco(podado);

    const catalogo = await getVagaCatalogo();
    return NextResponse.json({
      ok: true,
      banco: getConteudoBanco(),
      segmentosAtivos: resolverSegmentosAtivos(catalogo),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível salvar", detail: err.message },
      { status: 500 },
    );
  }
}
