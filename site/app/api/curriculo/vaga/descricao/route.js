import { NextResponse } from "next/server";
import { buildDescricaoParaVaga } from "@/lib/descricaoVaga.js";
import { inferirPerfilPorVaga, resolverPerfilSlug } from "@/lib/perfilCvSegmento.js";
import { getFonteCandidato } from "@/lib/fonteCandidato.js";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const vaga_titulo = String(body.vaga_titulo ?? "").trim();
    const vaga_descricao = String(body.vaga_descricao ?? "").trim();

    if (vaga_descricao.length < 20 && vaga_titulo.length < 3) {
      return NextResponse.json(
        { error: "Cole título ou descrição da vaga." },
        { status: 400 },
      );
    }

    const fonte = getFonteCandidato();
    const segmento_slug = resolverPerfilSlug(
      body.segmento_slug ||
        inferirPerfilPorVaga(vaga_titulo, vaga_descricao, fonte),
    );

    const texto = buildDescricaoParaVaga({
      vaga_titulo,
      vaga_descricao,
      segmento_slug,
      fonte,
    });

    return NextResponse.json({
      ok: true,
      texto,
      segmento_slug,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não gerou a descrição", detail: err.message },
      { status: 500 },
    );
  }
}
