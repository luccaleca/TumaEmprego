"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import CvDocumentViewer from "@/components/curriculo/CvDocumentViewer";
import CvDropZone from "@/components/curriculo/CvDropZone";
import CvRamificacoes from "@/components/curriculo/CvRamificacoes";
import { labelSegmento, resumoAlvos } from "@/lib/cvSegmentoTema";

function estadoPdf(pdf = {}) {
  return {
    temPdf: Boolean(pdf.temPdf),
    pdfDesatualizado: Boolean(pdf.desatualizado),
    pdfUrl: pdf.pdfUrl ?? null,
  };
}

export default function CurriculoWorkspace({ initialArquivo, initialSegmentacoes }) {
  const [arquivo, setArquivo] = useState(initialArquivo);
  const [documentoAberto, setDocumentoAberto] = useState(null);
  const [sectionsUpdate, setSectionsUpdate] = useState(null);
  const [metaUpdate, setMetaUpdate] = useState(null);

  const abrirPrincipal = useCallback(async () => {
    const temPdfUpload = Boolean(arquivo);

    setDocumentoAberto({
      tipo: "principal",
      id: "principal",
      titulo: arquivo?.name ?? "Currículo principal",
      subtitulo: temPdfUpload ? "PDF principal" : "Texto base (cv-base.md)",
      preamble: null,
      sections: null,
      content: null,
      editavel: false,
      loading: true,
      defaultViewMode: temPdfUpload ? "pdf" : "text",
      ...estadoPdf(
        temPdfUpload
          ? {
              temPdf: true,
              pdfUrl: `/api/curriculo/arquivo?v=${encodeURIComponent(arquivo.updatedAt)}`,
            }
          : {},
      ),
    });

    try {
      const [baseRes, pdfRes] = await Promise.all([
        fetch("/api/curriculo/base"),
        fetch("/api/curriculo/pdf"),
      ]);
      const baseData = baseRes.ok ? await baseRes.json() : null;
      const pdfData = pdfRes.ok ? await pdfRes.json() : null;

      setDocumentoAberto((prev) =>
        prev?.id === "principal"
          ? {
              ...prev,
              content: baseData?.content ?? "",
              preamble: baseData?.preamble ?? "",
              sections: baseData?.sections ?? [],
              editavel: Boolean(baseData?.content),
              loading: false,
              subtitulo: temPdfUpload
                ? pdfData?.desatualizado
                  ? "PDF enviado · texto base mais recente"
                  : "PDF principal"
                : "Texto base (cv-base.md)",
              ...estadoPdf({
                temPdf: pdfData?.temPdf || temPdfUpload,
                desatualizado: pdfData?.desatualizado,
                pdfUrl:
                  pdfData?.pdfUrl ??
                  (temPdfUpload
                    ? `/api/curriculo/arquivo?v=${encodeURIComponent(arquivo.updatedAt)}`
                    : null),
              }),
            }
          : prev,
      );
    } catch {
      setDocumentoAberto((prev) =>
        prev?.id === "principal" ? { ...prev, loading: false, sections: [], content: "" } : prev,
      );
    }
  }, [arquivo]);

  const abrirSegmentacao = useCallback(async (segmentacao, initialSections = null) => {
    const titulo =
      segmentacao.origem === "busca" || segmentacao.origem === "segmento"
        ? labelSegmento(segmentacao)
        : segmentacao.vaga_titulo;
    const subtitulo =
      segmentacao.origem === "busca" || segmentacao.origem === "segmento"
        ? resumoAlvos(segmentacao)
        : "Variação de currículo";

    if (!segmentacao.hasMd && segmentacao.hasPdf) {
      setDocumentoAberto({
        tipo: "segmentacao",
        id: segmentacao.id,
        titulo,
        subtitulo,
        sections: null,
        content: null,
        editavel: false,
        loading: false,
        ...estadoPdf({
          temPdf: true,
          pdfUrl: `/api/curriculo/segmentacoes/${segmentacao.id}/arquivo`,
        }),
      });
      return;
    }

    setDocumentoAberto({
      tipo: "segmentacao",
      id: segmentacao.id,
      titulo,
      subtitulo,
      sections: initialSections?.length ? initialSections : null,
      content: null,
      editavel: true,
      loading: true,
      ...estadoPdf({}),
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
              ...estadoPdf({
                temPdf: pdf.temPdf,
                desatualizado: pdf.desatualizado,
                pdfUrl: pdf.temPdf
                  ? `/api/curriculo/segmentacoes/${segmentacao.id}/arquivo?v=${encodeURIComponent(pdf.pdfUpdatedAt)}`
                  : null,
              }),
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
  }, []);

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
                pdfDesatualizado: prev.temPdf ? true : prev.pdfDesatualizado,
              }
            : prev,
        );
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

      setDocumentoAberto((prev) =>
        prev?.id === documentoAberto.id
          ? {
              ...prev,
              content: data.content,
              sections: data.sections ?? [],
              pdfDesatualizado: prev.temPdf ? true : prev.pdfDesatualizado,
            }
          : prev,
      );

      setSectionsUpdate({ id: documentoAberto.id, sections: data.sections ?? [] });
    },
    [documentoAberto],
  );

  const gerarPdf = useCallback(async () => {
    if (!documentoAberto) return;

    const url =
      documentoAberto.tipo === "principal"
        ? "/api/curriculo/pdf"
        : `/api/curriculo/segmentacoes/${documentoAberto.id}/pdf`;

    const res = await fetch(url, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.error);

    setDocumentoAberto((prev) =>
      prev
        ? {
            ...prev,
            temPdf: true,
            pdfDesatualizado: false,
            pdfUrl: data.pdfUrl,
          }
        : prev,
    );

    if (documentoAberto.tipo === "principal" && data.file) {
      setArquivo(data.file);
    }

    if (documentoAberto.tipo === "segmentacao" && data.meta) {
      setMetaUpdate({ id: documentoAberto.id, meta: data.meta });
    }
  }, [documentoAberto]);

  function fecharDocumento() {
    setDocumentoAberto(null);
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-gradient-to-b from-zinc-100/40 via-white to-zinc-50/30">
      <header className="shrink-0 border-b border-zinc-200/60 bg-white/80 px-4 py-2.5 text-center backdrop-blur-sm sm:px-6">
        <h1 className="text-sm font-semibold tracking-tight text-zinc-900">Currículo</h1>
        <p className="text-[11px] text-zinc-500">
          Principal e variações ·{" "}
          <Link href="/conteudo" className="text-emerald-700 hover:underline">
            Banco de conteúdo
          </Link>
        </p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-4 sm:px-6">
        {documentoAberto ? (
          <CvDocumentViewer
            titulo={documentoAberto.titulo}
            subtitulo={documentoAberto.subtitulo}
            preamble={documentoAberto.preamble}
            defaultViewMode={documentoAberto.defaultViewMode ?? "text"}
            sections={documentoAberto.sections}
            content={documentoAberto.content ?? ""}
            editavel={documentoAberto.editavel}
            loading={documentoAberto.loading}
            pdfUrl={documentoAberto.pdfUrl}
            temPdf={documentoAberto.temPdf}
            pdfDesatualizado={documentoAberto.pdfDesatualizado}
            onFechar={fecharDocumento}
            onSalvar={documentoAberto.editavel ? salvarDocumento : undefined}
            onGerarPdf={documentoAberto.editavel ? gerarPdf : undefined}
          />
        ) : (
          <section aria-label="Currículo principal" className="flex w-full max-w-md flex-col items-center">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Principal
            </p>
            <div className="w-full rounded-xl border border-zinc-200/90 bg-white p-3 shadow-md ring-1 ring-zinc-200/40 sm:p-4">
              <CvDropZone
                initialArquivo={arquivo}
                variant="stage"
                onAbrirPreview={abrirPrincipal}
                onUploaded={(data) => {
                  if (data.file) setArquivo(data.file);
                }}
              />
            </div>
          </section>
        )}
      </div>

      <div className="shrink-0 border-t border-zinc-200/70 bg-white/90 px-4 py-2.5 backdrop-blur-sm sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <CvRamificacoes
            initialSegmentacoes={initialSegmentacoes}
            sectionsUpdate={sectionsUpdate}
            metaUpdate={metaUpdate}
            documentoAbertoId={documentoAberto?.id ?? null}
            onAbrirDocumento={abrirSegmentacao}
            onDocumentoRemovido={() => setDocumentoAberto(null)}
          />
        </div>
      </div>
    </div>
  );
}
