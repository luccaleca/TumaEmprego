"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import CvDocumentViewer from "@/components/curriculo/CvDocumentViewer";
import CvEstruturaBaseCard from "@/components/curriculo/CvEstruturaBaseCard";
import CvRamificacoes from "@/components/curriculo/CvRamificacoes";
import { labelSegmento, resumoAlvos } from "@/lib/cvSegmentoTema";

export default function CurriculoWorkspace({ initialSegmentacoes, estruturaBase = null }) {
  const [documentoAberto, setDocumentoAberto] = useState(null);
  const [sectionsUpdate, setSectionsUpdate] = useState(null);
  const [metaUpdate, setMetaUpdate] = useState(null);
  const [estruturaPreview, setEstruturaPreview] = useState(estruturaBase);

  const abrirEstruturaBase = useCallback(async () => {
    const base = estruturaPreview ?? { preamble: "", sections: [], content: "" };

    setDocumentoAberto({
      tipo: "principal",
      id: "principal",
      titulo: "Estrutura base",
      subtitulo: "Modelo ATS — layout que a IA segue nas variações",
      preamble: base.preamble ?? "",
      sections: base.sections ?? [],
      content: base.content ?? "",
      editavel: true,
      loading: false,
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
      /* mantém dados já carregados na página */
    }
  }, [estruturaPreview]);

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
        temPdf: true,
        pdfUrl: `/api/curriculo/segmentacoes/${segmentacao.id}/arquivo`,
        pdfDesatualizado: false,
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
      temPdf: false,
      pdfUrl: null,
      pdfDesatualizado: false,
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

      setDocumentoAberto((prev) =>
        prev?.id === documentoAberto.id
          ? {
              ...prev,
              content: data.content,
              sections: data.sections ?? [],
              pdfDesatualizado: prev.temPdf ? true : false,
            }
          : prev,
      );

      setSectionsUpdate({ id: documentoAberto.id, sections: data.sections ?? [] });
    },
    [documentoAberto],
  );

  const gerarPdf = useCallback(async () => {
    if (!documentoAberto || documentoAberto.tipo !== "segmentacao") return;

    const res = await fetch(`/api/curriculo/segmentacoes/${documentoAberto.id}/pdf`, {
      method: "POST",
    });
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

    if (data.meta) {
      setMetaUpdate({ id: documentoAberto.id, meta: data.meta });
    }
  }, [documentoAberto]);

  function fecharDocumento() {
    setDocumentoAberto(null);
  }

  const podeGerarPdf = documentoAberto?.tipo === "segmentacao" && documentoAberto.editavel;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-gradient-to-b from-zinc-100/40 via-white to-zinc-50/30">
      <header className="shrink-0 border-b border-zinc-200/60 bg-white/80 px-4 py-2.5 text-center backdrop-blur-sm sm:px-6">
        <h1 className="text-sm font-semibold tracking-tight text-zinc-900">Currículo</h1>
        <p className="text-[11px] text-zinc-500">
          Variações por segmento ·{" "}
          <Link href="/vaga" className="text-emerald-700 hover:underline">
            Adaptar para vaga
          </Link>
          {" · "}
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
          />
        ) : (
          <section aria-label="Estrutura base" className="flex w-full flex-col items-center">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Base
            </p>
            <CvEstruturaBaseCard
              preamble={estruturaPreview?.preamble ?? ""}
              sections={estruturaPreview?.sections ?? []}
              onAbrir={abrirEstruturaBase}
            />
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
