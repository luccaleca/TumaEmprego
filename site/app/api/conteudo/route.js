import { NextResponse } from "next/server";
import { getConteudoBanco, saveConteudoBanco } from "@/lib/dados";
import { migrarFerramentasBancoSeNecessario } from "@/lib/migrarStackDoBanco";
import { listarTodosSegmentosCatalogo, resolverSegmentosAtivos } from "@/lib/segmentosAtivos";
import { getVagaCatalogo } from "@/lib/vagaCatalogo";

function bancoSemFerramentas(banco) {
  if (!banco?.ferramentas?.length) return banco;
  const { ferramentas: _f, ...rest } = banco;
  return rest;
}

export async function GET() {
  try {
    await migrarFerramentasBancoSeNecessario();

    const catalogo = await getVagaCatalogo();
    const segmentosAtivos = resolverSegmentosAtivos(catalogo);

    return NextResponse.json({
      banco: bancoSemFerramentas(getConteudoBanco()),
      segmentosAtivos,
      todosSegmentos: listarTodosSegmentosCatalogo(catalogo),
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

    saveConteudoBanco(bancoSemFerramentas(banco));

    const catalogo = await getVagaCatalogo();
    return NextResponse.json({
      ok: true,
      banco: bancoSemFerramentas(getConteudoBanco()),
      segmentosAtivos: resolverSegmentosAtivos(catalogo),
      todosSegmentos: listarTodosSegmentosCatalogo(catalogo),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível salvar", detail: err.message },
      { status: 500 },
    );
  }
}
