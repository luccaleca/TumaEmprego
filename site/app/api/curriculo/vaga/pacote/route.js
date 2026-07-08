import { NextResponse } from "next/server";
import { parseCvBase } from "@/lib/cv";
import { executarPacoteCvVaga } from "@/lib/adaptarCvVaga";
import { getSegmentacaoConteudo } from "@/lib/segmentacoes";

const SITE_ORIGIN = process.env.TUMA_SITE_ORIGIN ?? "http://localhost:3737";

function absolutizarPdfUrl(pdfUrl) {
  if (!pdfUrl) return null;
  if (pdfUrl.startsWith("http")) return pdfUrl;
  return `${SITE_ORIGIN}${pdfUrl.startsWith("/") ? pdfUrl : `/${pdfUrl}`}`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const vaga_descricao = String(body?.vaga_descricao ?? "").trim();
    const vaga_titulo = String(body?.vaga_titulo ?? "").trim();
    const vaga_url = String(body?.vaga_url ?? "").trim();
    const segmento_slug = String(body?.segmento_slug ?? "").trim() || undefined;
    const gerar_pdf = body?.gerar_pdf !== false;

    if (vaga_descricao.length < 20) {
      return NextResponse.json(
        { error: "Descrição da vaga curta demais (mínimo 20 caracteres)" },
        { status: 400 },
      );
    }

    const pacote = await executarPacoteCvVaga(
      { vaga_titulo, vaga_descricao, vaga_url, segmento_slug },
      { gerarPdf: gerar_pdf },
    );

    if (pacote.status === "concluido") {
      let sections = [];
      const md = getSegmentacaoConteudo(pacote.segmentacao.id);
      if (md?.formato === "markdown") {
        sections = parseCvBase(md.content);
      }

      const pdfUrl = absolutizarPdfUrl(pacote.pdf?.pdfUrl);

      return NextResponse.json({
        ok: true,
        pacote: {
          ...pacote,
          pdf: pacote.pdf ? { ...pacote.pdf, pdfUrl } : null,
        },
        segmentacao: pacote.segmentacao,
        segmento_slug: pacote.segmento_slug,
        segmento_label: pacote.segmento_label,
        scores: pacote.scores,
        sections,
        pdfUrl,
        revisarUrl: `${SITE_ORIGIN}/vaga`,
      });
    }

    if (pacote.status === "pendente") {
      return NextResponse.json(
        {
          error: pacote.instrucao ?? "Adaptação pendente",
          pacote,
        },
        { status: 422 },
      );
    }

    if (pacote.status === "erro" && pacote.motivo === "descricao_curta") {
      return NextResponse.json({ error: "Descrição da vaga inválida", pacote }, { status: 400 });
    }

    return NextResponse.json(
      { error: pacote.motivo ?? "Não foi possível gerar o pacote", pacote },
      { status: 500 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Erro ao gerar pacote", detail: err.message },
      { status: 500 },
    );
  }
}
