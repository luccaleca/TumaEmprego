import { NextResponse } from "next/server";
import { parseCvBase } from "@/lib/cv";
import { executarPacoteVaga } from "@/lib/adaptarVagaPacote";
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
    const vaga_empresa = String(body?.vaga_empresa ?? "").trim();
    const vaga_url = String(body?.vaga_url ?? "").trim();
    const segmento_slug = String(body?.segmento_slug ?? "").trim() || undefined;
    const gerar_pdf = body?.gerar_pdf !== false;
    const salvar = body?.salvar !== false;
    const formato = String(body?.formato ?? "auto").trim() || "auto";
    const portal = String(body?.portal ?? "").trim() || undefined;
    const via_extensao = Boolean(body?.via_extensao);

    if (vaga_descricao.length < 20) {
      return NextResponse.json(
        { error: "Descrição da vaga curta demais (mínimo 20 caracteres)" },
        { status: 400 },
      );
    }

    const pacote = await executarPacoteVaga(
      {
        vaga_titulo,
        vaga_empresa,
        vaga_descricao,
        vaga_url,
        segmento_slug,
        formato,
        portal,
        via_extensao,
        salvar,
      },
      { gerarPdf: gerar_pdf && salvar },
    );

    if (pacote.status === "concluido" && (pacote.so_estrutura || pacote.portal === "gupy") && pacote.formato_gerado == null) {
      return NextResponse.json({
        ok: true,
        so_estrutura: true,
        portal: pacote.portal ?? "gupy",
        portal_nome: pacote.portal_nome ?? "Gupy",
        portal_status: pacote.portal_status ?? "ativo",
        portal_motor_ativo: Boolean(pacote.portal_motor_ativo),
        formato_gerado: null,
        segmento_slug: pacote.segmento_slug ?? segmento_slug ?? null,
        pedido: pacote.pedido ?? null,
        vaga_url: vaga_url || pacote.pedido?.vaga_url || null,
        revisarUrl: `${SITE_ORIGIN}/curriculo`,
        mensagem: "Gupy usa estrutura do portal — preencha com a extensão.",
      });
    }

    if (pacote.status === "concluido" && pacote.formato_gerado === "solides") {
      return NextResponse.json({
        ok: true,
        portal: pacote.portal ?? "solides",
        portal_nome: pacote.portal_nome ?? "Sólides",
        portal_status: pacote.portal_status ?? "ativo",
        portal_motor_ativo: true,
        formato_gerado: "solides",
        segmentacao: pacote.segmentacao,
        segmentacao_id: pacote.segmentacao_id,
        segmento_slug: pacote.segmento_slug,
        segmento_label: pacote.segmento_label,
        scores: pacote.scores,
        solides: pacote.solides,
        preview: pacote.preview,
        candidatura: pacote.candidatura ?? null,
        vaga_url: vaga_url || pacote.segmentacao?.vaga_url || null,
        revisarUrl: `${SITE_ORIGIN}/curriculo?id=${encodeURIComponent(pacote.segmentacao_id)}`,
      });
    }

    if (pacote.status === "concluido") {
      let sections = [];
      const conteudoMd = pacote.conteudo || null;
      if (pacote.segmentacao?.id) {
        const md = getSegmentacaoConteudo(pacote.segmentacao.id);
        if (md?.formato === "markdown") {
          sections = parseCvBase(md.content);
        }
      } else if (conteudoMd) {
        sections = parseCvBase(conteudoMd);
      }

      const pdfUrl = absolutizarPdfUrl(pacote.pdf?.pdfUrl);
      const segmentacaoId = pacote.segmentacao?.id ?? null;

      return NextResponse.json({
        ok: true,
        portal: pacote.portal ?? null,
        portal_nome: pacote.portal_nome ?? null,
        portal_status: pacote.portal_status ?? null,
        portal_motor_ativo: pacote.portal_motor_ativo ?? false,
        formato_gerado: "ats",
        salvo: Boolean(pacote.salvo ?? segmentacaoId),
        preview: conteudoMd || null,
        pacote: {
          ...pacote,
          pdf: pacote.pdf ? { ...pacote.pdf, pdfUrl } : null,
        },
        segmentacao: pacote.segmentacao ?? null,
        segmentacao_id: segmentacaoId,
        segmento_slug: pacote.segmento_slug,
        segmento_label: pacote.segmento_label,
        scores: pacote.scores,
        sections,
        pdfUrl,
        candidatura: pacote.candidatura ?? null,
        vaga_titulo: pacote.vaga_titulo ?? vaga_titulo,
        vaga_empresa: pacote.vaga_empresa ?? vaga_empresa,
        vaga_url: vaga_url || pacote.segmentacao?.vaga_url || null,
        revisarUrl: segmentacaoId
          ? `${SITE_ORIGIN}/curriculo?id=${encodeURIComponent(segmentacaoId)}`
          : `${SITE_ORIGIN}/curriculo`,
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
      { error: pacote.motivo ?? "Não gerou o pacote", pacote },
      { status: 500 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Erro ao gerar pacote", detail: err.message },
      { status: 500 },
    );
  }
}
