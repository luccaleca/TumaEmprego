"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CvColunasBoard from "@/components/curriculo/CvColunasBoard";
import CvDocumentViewer from "@/components/curriculo/CvDocumentViewer";
import CvEstruturasRow from "@/components/curriculo/CvEstruturasRow";
import PortalEstruturaModal from "@/components/portais/PortalEstruturaModal";
import SolidesPacoteViewer from "@/components/vaga/SolidesPacoteViewer";
import { labelCvVaga, labelSegmento, resumoAlvos } from "@/lib/cvSegmentoTema";

function encontrarSegmentacaoNasColunas(colunas, id) {
  if (!id) return null;
  for (const col of colunas ?? []) {
    if (col.slot?.id === id) return col.slot;
    const hit =
      col.candidaturas?.find((s) => s.id === id) ??
      col.manuais?.find((s) => s.id === id);
    if (hit) return hit;
  }
  return null;
}

export default function CurriculoWorkspace({
  initialColunas = [],
  initialPortais = [],
  valoresPortais = {},
  estruturaBase = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [colunas, setColunas] = useState(initialColunas);
  const [documentoAberto, setDocumentoAberto] = useState(null);
  const [estruturaPreview, setEstruturaPreview] = useState(estruturaBase);
  const [portalMolde, setPortalMolde] = useState(null);
  const [valoresPortaisState, setValoresPortaisState] = useState(valoresPortais);
  const [solidesPreview, setSolidesPreview] = useState("");
  const [solidesLoading, setSolidesLoading] = useState(false);
  const [solidesGerando, setSolidesGerando] = useState(false);
  const [solidesDesatualizado, setSolidesDesatualizado] = useState(false);
  const [solidesExcluindo, setSolidesExcluindo] = useState(false);
  const ignorarUrlRef = useRef(false);

  useEffect(() => {
    setValoresPortaisState(valoresPortais);
  }, [valoresPortais]);

  function aoSalvarPortal(portalId, valoresAtualizados) {
    setValoresPortaisState((prev) => ({
      ...prev,
      [portalId]: valoresAtualizados,
    }));
  }

  const abrirEstruturaBase = useCallback(async () => {
    const base = estruturaPreview ?? { preamble: "", sections: [], content: "" };

    setDocumentoAberto({
      tipo: "principal",
      id: "principal",
      titulo: "Estrutura base",
      subtitulo: null,
      preamble: base.preamble ?? "",
      sections: base.sections ?? [],
      content: base.content ?? "",
      editavel: true,
      loading: false,
      portal: null,
    });

    try {
      const res = await fetch("/api/curriculo/base");
      if (!res.ok) return;
      const data = await res.json();

      setDocumentoAberto((prev) =>
        prev?.id !== "principal"
          ? prev
          : {
              ...prev,
              content: data.content ?? prev.content,
              preamble: data.preamble ?? prev.preamble,
              sections: data.sections?.length ? data.sections : prev.sections,
            },
      );

      setEstruturaPreview({
        preamble: data.preamble ?? base.preamble ?? "",
        sections: data.sections?.length ? data.sections : base.sections ?? [],
        content: data.content ?? base.content ?? "",
      });
    } catch {
      /* mantém dados já carregados */
    }
  }, [estruturaPreview]);

  const carregarSolides = useCallback(async (segmentacaoId) => {
    setSolidesLoading(true);
    try {
      const res = await fetch(`/api/curriculo/segmentacoes/${segmentacaoId}/solides`);
      if (!res.ok) {
        setSolidesPreview("");
        setSolidesDesatualizado(false);
        return;
      }
      const data = await res.json();
      setSolidesPreview(data.preview ?? "");
      setSolidesDesatualizado(false);
    } catch {
      setSolidesPreview("");
    } finally {
      setSolidesLoading(false);
    }
  }, []);

  const gerarPacoteSolides = useCallback(async (segmentacaoId, titulo) => {
    setSolidesGerando(true);
    try {
      const res = await fetch("/api/curriculo/solides/pacote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmentacao_id: segmentacaoId,
          vaga_titulo: titulo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail);
      setSolidesPreview(data.preview ?? "");
      setSolidesDesatualizado(false);
      return data;
    } finally {
      setSolidesGerando(false);
    }
  }, []);

  const abrirSegmentacao = useCallback(
    async (segmentacao, initialSections = null) => {
      ignorarUrlRef.current = false;
      const ehSolides = segmentacao.portal === "solides" && segmentacao.origem === "vaga";
      const titulo =
        segmentacao.label_cv ||
        (segmentacao.origem === "busca" || segmentacao.origem === "segmento"
          ? labelSegmento(segmentacao)
          : labelCvVaga(segmentacao));
      const subtitulo =
        segmentacao.origem === "busca" || segmentacao.origem === "segmento"
          ? resumoAlvos(segmentacao)
          : segmentacao.vaga_empresa
            ? String(segmentacao.vaga_empresa)
            : null;

      router.replace(`/curriculo?id=${encodeURIComponent(segmentacao.id)}`, { scroll: false });

      if (ehSolides) {
        setSolidesPreview("");
        setDocumentoAberto({
          tipo: "segmentacao",
          id: segmentacao.id,
          titulo,
          subtitulo,
          portal: "solides",
          sections: null,
          content: null,
          editavel: false,
          loading: true,
          temPdf: false,
          pdfUrl: `/api/curriculo/segmentacoes/${segmentacao.id}/solides/form`,
          pdfDesatualizado: false,
          podeExcluir: !segmentacao.slot,
        });

        try {
          const res = await fetch(`/api/curriculo/segmentacoes/${segmentacao.id}/conteudo`);
          const data = await res.json();
          if (res.ok && data.content) {
            setSolidesPreview(data.content);
          } else {
            await carregarSolides(segmentacao.id);
          }
          setDocumentoAberto((prev) =>
            prev?.id === segmentacao.id ? { ...prev, loading: false, content: data.content } : prev,
          );
        } catch {
          await carregarSolides(segmentacao.id);
          setDocumentoAberto((prev) =>
            prev?.id === segmentacao.id ? { ...prev, loading: false } : prev,
          );
        }
        return;
      }

      if (!segmentacao.hasMd && segmentacao.hasPdf) {
        setDocumentoAberto({
          tipo: "segmentacao",
          id: segmentacao.id,
          titulo,
          subtitulo,
          portal: segmentacao.portal ?? null,
          sections: null,
          content: null,
          editavel: false,
          loading: false,
          temPdf: true,
          pdfUrl: `/api/curriculo/segmentacoes/${segmentacao.id}/arquivo`,
          pdfDesatualizado: false,
          podeExcluir: !segmentacao.slot,
        });
        return;
      }

      setDocumentoAberto({
        tipo: "segmentacao",
        id: segmentacao.id,
        titulo,
        subtitulo,
        portal: segmentacao.portal ?? null,
        sections: initialSections?.length ? initialSections : null,
        content: null,
        editavel: true,
        loading: true,
        temPdf: false,
        pdfUrl: null,
        pdfDesatualizado: false,
        podeExcluir: !segmentacao.slot,
      });

      try {
        const res = await fetch(`/api/curriculo/segmentacoes/${segmentacao.id}/conteudo`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.detail);

        const pdf = data.pdf ?? {};
        setDocumentoAberto((prev) =>
          prev?.id === segmentacao.id
            ? {
                ...prev,
                content: data.content ?? "",
                sections: data.sections ?? initialSections ?? [],
                editavel: data.editavel !== false,
                loading: false,
                temPdf: pdf.temPdf,
                pdfDesatualizado: pdf.desatualizado,
                pdfUrl: pdf.temPdf
                  ? `/api/curriculo/segmentacoes/${segmentacao.id}/arquivo?v=${encodeURIComponent(pdf.pdfUpdatedAt)}`
                  : null,
              }
            : prev,
        );
      } catch {
        setDocumentoAberto((prev) =>
          prev?.id === segmentacao.id
            ? { ...prev, sections: initialSections ?? [], content: "", loading: false }
            : prev,
        );
      }
    },
    [carregarSolides, router],
  );

  function fecharDocumento() {
    ignorarUrlRef.current = true;
    setDocumentoAberto(null);
    setSolidesPreview("");
    router.replace("/curriculo", { scroll: false });
  }

  async function excluirDocumentoAberto() {
    if (!documentoAberto || documentoAberto.tipo !== "segmentacao" || !documentoAberto.podeExcluir) {
      return;
    }
    const id = documentoAberto.id;
    const res = await fetch(`/api/curriculo/segmentacoes/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.detail || "Erro ao excluir");
    setColunas((prev) =>
      prev.map((col) => ({
        ...col,
        candidaturas: (col.candidaturas ?? []).filter((s) => s.id !== id),
        manuais: (col.manuais ?? []).filter((s) => s.id !== id),
      })),
    );
    fecharDocumento();
  }

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) {
      ignorarUrlRef.current = false;
      return;
    }
    if (ignorarUrlRef.current) return;
    if (documentoAberto?.id === id) return;

    const seg = encontrarSegmentacaoNasColunas(colunas, id);
    if (seg) {
      abrirSegmentacao(seg, seg._sections ?? null);
    }
  }, [searchParams, colunas, documentoAberto?.id, abrirSegmentacao]);

  const salvarDocumento = useCallback(
    async (content) => {
      if (!documentoAberto) return;

      if (documentoAberto.tipo === "principal") {
        const res = await fetch("/api/curriculo/base", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || data.error);

        setDocumentoAberto((prev) =>
          prev?.id === "principal"
            ? {
                ...prev,
                content: data.content,
                preamble: data.preamble ?? prev.preamble,
                sections: data.sections ?? [],
              }
            : prev,
        );
        setEstruturaPreview({
          preamble: data.preamble ?? "",
          sections: data.sections ?? [],
          content: data.content ?? "",
        });
        return;
      }

      const res = await fetch(
        `/api/curriculo/segmentacoes/${documentoAberto.id}/conteudo`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error);

      const jaTinhaPdf = Boolean(documentoAberto.temPdf);
      let pdfUrl = documentoAberto.pdfUrl;
      let temPdf = jaTinhaPdf;
      let pdfDesatualizado = jaTinhaPdf;

      // Se já havia PDF, regenera na hora — senão o usuário fica com arquivo velho
      if (jaTinhaPdf) {
        try {
          const pdfRes = await fetch(
            `/api/curriculo/segmentacoes/${documentoAberto.id}/pdf`,
            { method: "POST" },
          );
          const pdfData = await pdfRes.json();
          if (pdfRes.ok && pdfData.pdfUrl) {
            pdfUrl = pdfData.pdfUrl;
            temPdf = true;
            pdfDesatualizado = false;
          }
        } catch {
          /* mantém desatualizado */
        }
      }

      setDocumentoAberto((prev) =>
        prev?.id === documentoAberto.id
          ? {
              ...prev,
              content: data.content,
              sections: data.sections ?? [],
              temPdf,
              pdfUrl,
              pdfDesatualizado,
            }
          : prev,
      );
    },
    [documentoAberto],
  );

  const gerarPdf = useCallback(async () => {
    if (!documentoAberto || documentoAberto.tipo !== "segmentacao") return null;

    const res = await fetch(`/api/curriculo/segmentacoes/${documentoAberto.id}/pdf`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.error);

    const nextUrl = data.pdfUrl;
    setDocumentoAberto((prev) =>
      prev
        ? {
            ...prev,
            temPdf: true,
            pdfDesatualizado: false,
            pdfUrl: nextUrl,
          }
        : prev,
    );
    return nextUrl;
  }, [documentoAberto]);

  const podeGerarPdf =
    documentoAberto?.tipo === "segmentacao" &&
    documentoAberto.editavel &&
    documentoAberto.portal !== "solides";

  const ehSolidesAberto =
    documentoAberto?.portal === "solides" && documentoAberto.tipo === "segmentacao";

  return (
    <>
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-gradient-to-b from-zinc-100/40 via-white to-zinc-50/30">
        <header className="shrink-0 border-b border-zinc-200/60 bg-white/80 px-4 py-2.5 text-center backdrop-blur-sm sm:px-6">
          <h1 className="text-sm font-semibold tracking-tight text-zinc-900">Currículo</h1>
        </header>

        {documentoAberto ? (
          <div className="flex flex-1 flex-col items-center px-4 py-4 sm:px-6">
            {ehSolidesAberto ? (
              <section className="flex w-full max-w-2xl flex-col">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {documentoAberto.titulo}
                    </p>
                    <span className="mt-0.5 inline-flex rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-violet-800">
                      Sólides
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {documentoAberto.podeExcluir ? (
                      <button
                        type="button"
                        onClick={async () => {
                          setSolidesExcluindo(true);
                          try {
                            await excluirDocumentoAberto();
                          } catch {
                            /* message via state if needed */
                          } finally {
                            setSolidesExcluindo(false);
                          }
                        }}
                        disabled={solidesExcluindo}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {solidesExcluindo ? "Excluindo…" : "Excluir"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={fecharDocumento}
                      className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
                <div className="overflow-hidden rounded-xl border border-violet-200/80 bg-white shadow-md ring-1 ring-violet-100">
                  <div className="h-[min(70vh,calc(100vh-10rem))] min-h-[320px]">
                    <SolidesPacoteViewer
                      segmentacaoId={documentoAberto.id}
                      preview={solidesPreview || documentoAberto.content || ""}
                      loading={solidesLoading || documentoAberto.loading}
                      gerando={solidesGerando}
                      desatualizado={solidesDesatualizado}
                      onGerar={() =>
                        gerarPacoteSolides(documentoAberto.id, documentoAberto.titulo)
                      }
                    />
                  </div>
                </div>
              </section>
            ) : (
              <CvDocumentViewer
                titulo={documentoAberto.titulo}
                subtitulo={documentoAberto.subtitulo}
                preamble={documentoAberto.preamble}
                sections={documentoAberto.sections}
                content={documentoAberto.content ?? ""}
                editavel={documentoAberto.editavel}
                loading={documentoAberto.loading}
                modoEstrutura={documentoAberto.tipo === "principal"}
                pdfUrl={documentoAberto.pdfUrl}
                temPdf={documentoAberto.temPdf}
                pdfDesatualizado={documentoAberto.pdfDesatualizado}
                onFechar={fecharDocumento}
                onSalvar={documentoAberto.editavel ? salvarDocumento : undefined}
                onGerarPdf={podeGerarPdf ? gerarPdf : undefined}
                onExcluir={documentoAberto.podeExcluir ? excluirDocumentoAberto : undefined}
              />
            )}
          </div>
        ) : (
          <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6">
            <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-100">
              <div className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-3 sm:px-5">
                <p className="text-sm font-semibold text-zinc-900">Currículo</p>
              </div>

              <div className="divide-y divide-zinc-100">
                <section className="px-4 py-4 sm:px-5" aria-labelledby="cv-estrutura-heading">
                  <h2 id="cv-estrutura-heading" className="mb-3 text-xs font-semibold text-zinc-900">
                    Estrutura
                  </h2>
                  <CvEstruturasRow
                    portais={initialPortais}
                    onAbrirBase={abrirEstruturaBase}
                    onAbrirPortal={setPortalMolde}
                  />
                </section>

                <section className="px-4 py-4 sm:px-5" aria-labelledby="cv-segmentos-heading">
                  <h2 id="cv-segmentos-heading" className="mb-3 text-xs font-semibold text-zinc-900">
                    Segmentos
                  </h2>
                  <CvColunasBoard
                    initialColunas={colunas}
                    documentoAbertoId={null}
                    onAbrirDocumento={abrirSegmentacao}
                    onDocumentoRemovido={fecharDocumento}
                    onColunasChange={setColunas}
                    embedded
                  />
                </section>
              </div>
            </div>
          </div>
        )}
      </div>

      <PortalEstruturaModal
        portal={portalMolde}
        valores={valoresPortaisState}
        onFechar={() => setPortalMolde(null)}
        onSalvo={aoSalvarPortal}
      />
    </>
  );
}
