import { NextResponse } from "next/server";
import { getTecnologias, saveTecnologias } from "@/lib/dados";
import {
  getTecnologiaCatalogo,
  resolverItensAtivos,
} from "@/lib/tecnologiaCatalogo";

export async function GET() {
  try {
    const catalogo = await getTecnologiaCatalogo();
    let tecnologias = getTecnologias();

    if (tecnologias.ativas?.length && !tecnologias.itens?.length) {
      const itens = resolverItensAtivos(catalogo, tecnologias.ativas);
      saveTecnologias({ ...tecnologias, itens });
      tecnologias = getTecnologias();
    }

    return NextResponse.json({ catalogo, tecnologias });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Não foi possível carregar tecnologias",
        detail: err.message,
      },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const ativas = body.ativas ?? body.tecnologias?.ativas;

    if (!Array.isArray(ativas)) {
      return NextResponse.json(
        { error: "Campo ativas obrigatório (array de slugs)" },
        { status: 400 },
      );
    }

    const catalogo = await getTecnologiaCatalogo();
    const itens = resolverItensAtivos(catalogo, ativas);
    const slugsValidos = new Set(itens.map((i) => i.slug));
    const ativasLimpas = ativas.filter((s) => slugsValidos.has(s));

    saveTecnologias({ ativas: ativasLimpas, itens });
    const tecnologias = getTecnologias();

    return NextResponse.json({ ok: true, catalogo, tecnologias });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível salvar", detail: err.message },
      { status: 500 },
    );
  }
}
