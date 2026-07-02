import { NextResponse } from "next/server";
import { parseCvBase } from "@/lib/cv";
import { executarAdaptacaoCvVaga } from "@/lib/adaptarCvVaga";
import { getSegmentacaoConteudo } from "@/lib/segmentacoes";

export async function POST(request) {
  try {
    const body = await request.json();
    const vaga_descricao = String(body?.vaga_descricao ?? "").trim();
    const vaga_titulo = String(body?.vaga_titulo ?? "").trim();

    if (!vaga_descricao || vaga_descricao.length < 20) {
      return NextResponse.json(
        { error: "Cole a descrição completa da vaga (mínimo 20 caracteres)" },
        { status: 400 },
      );
    }

    const adaptacao = await executarAdaptacaoCvVaga({ vaga_titulo, vaga_descricao });

    if (adaptacao.status === "concluido") {
      let sections = [];
      const md = getSegmentacaoConteudo(adaptacao.segmentacao.id);
      if (md?.formato === "markdown") {
        sections = parseCvBase(md.content);
      }

      return NextResponse.json({
        ok: true,
        adaptacao,
        segmentacao: adaptacao.segmentacao,
        sections,
      });
    }

    if (adaptacao.status === "pendente") {
      return NextResponse.json(
        {
          error: adaptacao.instrucao ?? "Adaptação pendente",
          adaptacao,
        },
        { status: 422 },
      );
    }

    if (adaptacao.status === "erro") {
      return NextResponse.json(
        { error: adaptacao.motivo ?? "Falha na adaptação", adaptacao },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Não foi possível gerar o currículo", adaptacao },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Erro ao gerar currículo", detail: err.message },
      { status: 500 },
    );
  }
}
