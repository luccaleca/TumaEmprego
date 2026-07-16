import { NextResponse } from "next/server";
import { getTecnologias, saveTecnologias } from "@/lib/dados";
import { migrarFerramentasBancoSeNecessario } from "@/lib/migrarStackDoBanco";
import {
  getTecnologiaCatalogo,
  resolverItensAtivos,
} from "@/lib/tecnologiaCatalogo";
import { aplicarOverridesSegmentos } from "@/lib/tecnologiasStack";

export async function GET() {
  try {
    await migrarFerramentasBancoSeNecessario();

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
    const extras = body.extras ?? body.tecnologias?.extras ?? [];
    const segmentos = body.segmentos ?? body.tecnologias?.segmentos ?? {};

    if (!Array.isArray(ativas)) {
      return NextResponse.json(
        { error: "Campo ativas obrigatório (array de slugs)" },
        { status: 400 },
      );
    }

    const catalogo = await getTecnologiaCatalogo();
    let itens = resolverItensAtivos(catalogo, ativas);
    itens = aplicarOverridesSegmentos(itens, segmentos);

    const slugsValidos = new Set(itens.map((i) => i.slug));
    const ativasLimpas = ativas.filter((s) => slugsValidos.has(s));

    saveTecnologias({
      ativas: ativasLimpas,
      itens,
      extras: Array.isArray(extras) ? extras : [],
      segmentos,
    });
    const tecnologias = getTecnologias();

    return NextResponse.json({ ok: true, catalogo, tecnologias });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível salvar", detail: err.message },
      { status: 500 },
    );
  }
}
