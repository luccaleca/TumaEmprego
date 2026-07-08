import { NextResponse } from "next/server";
import { executarPacoteSolidesVaga } from "@/lib/adaptarSolides";
import { getPortalSolides } from "@/lib/dados";

const SITE_ORIGIN = process.env.TUMA_SITE_ORIGIN ?? "http://localhost:3737";

export async function GET() {
  try {
    const portal = getPortalSolides();
    return NextResponse.json({
      portal: "solides",
      atualizado_em: portal.atualizado_em ?? null,
      cargos_interesse: portal.cargos_interesse ?? [],
      habilidades_count: portal.habilidades?.length ?? 0,
      idiomas_count: portal.idiomas?.length ?? 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível ler dados/portais/solides.yml", detail: err.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const vaga_descricao = String(body?.vaga_descricao ?? "").trim();
    const vaga_titulo = String(body?.vaga_titulo ?? "").trim();
    const vaga_url = String(body?.vaga_url ?? "").trim();
    const segmento_slug = String(body?.segmento_slug ?? "").trim() || undefined;
    const segmentacao_id = String(body?.segmentacao_id ?? "").trim() || undefined;

    const resultado = await executarPacoteSolidesVaga({
      vaga_titulo,
      vaga_descricao,
      vaga_url,
      segmento_slug,
      segmentacao_id,
    });

    if (resultado.status === "concluido") {
      return NextResponse.json({
        ok: true,
        portal: "solides",
        segmentacao: resultado.segmentacao,
        segmentacao_id: resultado.segmentacao_id,
        segmento_slug: resultado.segmento_slug,
        solides: resultado.solides,
        preview: resultado.preview,
        revisarUrl: `${SITE_ORIGIN}/vaga`,
      });
    }

    if (resultado.status === "pendente") {
      return NextResponse.json(
        { error: resultado.instrucao ?? "Adaptação pendente", pacote: resultado },
        { status: 422 },
      );
    }

    if (resultado.status === "erro" && resultado.motivo === "descricao_curta") {
      return NextResponse.json({ error: "Descrição da vaga inválida", pacote: resultado }, { status: 400 });
    }

    if (resultado.status === "erro" && resultado.motivo === "segmentacao_nao_encontrada") {
      return NextResponse.json({ error: "Segmentação não encontrada", pacote: resultado }, { status: 404 });
    }

    return NextResponse.json(
      { error: resultado.motivo ?? "Não foi possível gerar pacote Sólides", pacote: resultado },
      { status: 500 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Erro ao gerar pacote Sólides", detail: err.message },
      { status: 500 },
    );
  }
}
