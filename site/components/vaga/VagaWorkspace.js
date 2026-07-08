"use client";

import { useEffect, useCallback, useState } from "react";
import CvDocumentViewer from "@/components/curriculo/CvDocumentViewer";
import SolidesPacoteViewer from "@/components/vaga/SolidesPacoteViewer";
import { inputClass, textareaClass } from "@/components/profile/FormField";
import { formatDateTime } from "@/lib/format";

function VagaCard({ adaptacao, aberto, onAbrir, onDelete, deleting }) {
  const titulo = adaptacao.vaga_titulo || "Vaga";
  const ehSolides = adaptacao.portal === "solides";
  const preview = ehSolides
    ? adaptacao._sections?.find((s) => /resumo profissional/i.test(s.title))?.body?.slice(0, 120)
    : adaptacao._sections?.find((s) => s.title === "Resumo")?.body?.slice(0, 120);

  return (
    <article
      className={[
        "flex w-[148px] shrink-0 flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition",
        aberto ? "border-emerald-400 ring-2 ring-emerald-100" : "border-zinc-200/90 hover:border-emerald-200",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => onAbrir(adaptacao)}
        className="flex flex-1 flex-col p-2.5 text-left"
      >
        <span className="mb-1 inline-flex w-fit rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
          {ehSolides ? "Sólides" : "Vaga"}
        </span>
        <p className="line-clamp-2 text-xs font-medium leading-snug text-zinc-900">{titulo}</p>
        {preview ? (
          <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-zinc-500">{preview}</p>
        ) : null}
        <p className="mt-auto pt-2 text-[9px] text-zinc-400">
          {formatDateTime(adaptacao.atualizado_em ?? adaptacao.criado_em)}
        </p>
      </button>
      <div className="border-t border-zinc-100 px-2 py-1.5">
        <button
          type="button"
          onClick={() => onDelete(adaptacao.id)}
          disabled={deleting}
          className="text-[10px] font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {deleting ? "…" : "Excluir"}
        </button>
      </div>
    </article>
  );
}

export default function VagaWorkspace({ initialAdaptacoes = [] }) {
  const [adaptacoes, setAdaptacoes] = useState(initialAdaptacoes);
  const [documentoAberto, setDocumentoAberto] = useState(null);
  const [vagaTitulo, setVagaTitulo] = useState("");
  const [vagaDescricao, setVagaDescricao] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");
  const [gerarSolides, setGerarSolides] = useState(true);
  const [viewTab, setViewTab] = useState("ats");
  const [solidesPreview, setSolidesPreview] = useState("");
  const [solidesLoading, setSolidesLoading] = useState(false);
  const [solidesGerando, setSolidesGerando] = useState(false);
  const [solidesDesatualizado, setSolidesDesatualizado] = useState(false);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch("/api/curriculo/vaga");
        const data = await res.json();
        if (!res.ok || cancelado) return;
        setAdaptacoes(
          (data.adaptacoes ?? []).map((item) => ({
            ...item,
            _sections: item.sections ?? item._sections ?? [],
          })),
        );
      } catch {
        /* mantém SSR */
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

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

  const gerarPacoteSolides = useCallback(
    async (segmentacaoId, { vagaTitulo = "", vagaDescricao = "" } = {}) => {
      setSolidesGerando(true);
      try {
        const res = await fetch("/api/curriculo/solides/pacote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            segmentacao_id: segmentacaoId,
            vaga_titulo: vagaTitulo,
            vaga_descricao: vagaDescricao,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.detail);

        setSolidesPreview(data.preview ?? "");
        setSolidesDesatualizado(false);
        setViewTab("solides");
        return data;
      } finally {
        setSolidesGerando(false);
      }
    },
    [],
  );

  const abrirAdaptacao = useCallback(async (adaptacao, initialSections = null) => {
    const ehSolides = adaptacao.portal === "solides";
    setViewTab(ehSolides ? "solides" : "ats");
    setSolidesPreview("");
    setDocumentoAberto({
      id: adaptacao.id,
      titulo: adaptacao.vaga_titulo || "Vaga",
      subtitulo: ehSolides ? "Perfil Sólides Profiler" : "Currículo adaptado (ATS)",
      portal: adaptacao.portal ?? null,
      sections: initialSections?.length ? initialSections : null,
      content: null,
      loading: true,
      temPdf: Boolean(adaptacao.hasPdf),
      pdfUrl: adaptacao.hasPdf
        ? `/api/curriculo/segmentacoes/${adaptacao.id}/arquivo`
        : null,
      pdfDesatualizado: false,
    });

    try {
      const res = await fetch(`/api/curriculo/segmentacoes/${adaptacao.id}/conteudo`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail);

      const pdf = data.pdf ?? {};
      const meta = data.meta ?? {};
      const portalSolides = meta.portal === "solides" || ehSolides;
      if (portalSolides && data.content) {
        setSolidesPreview(data.content);
      }
      setDocumentoAberto((prev) =>
        prev?.id === adaptacao.id
          ? {
              ...prev,
              content: data.content ?? "",
              sections: data.sections ?? initialSections ?? [],
              loading: false,
              portal: meta.portal ?? prev.portal,
              temPdf: pdf.temPdf,
              pdfDesatualizado: pdf.desatualizado,
              pdfUrl: pdf.temPdf
                ? `/api/curriculo/segmentacoes/${adaptacao.id}/arquivo?v=${encodeURIComponent(pdf.pdfUpdatedAt)}`
                : prev.pdfUrl,
            }
          : prev,
      );
    } catch {
      setDocumentoAberto((prev) =>
        prev?.id === adaptacao.id
          ? { ...prev, sections: initialSections ?? [], content: "", loading: false }
          : prev,
      );
    }

    if (!portalSolides) {
      carregarSolides(adaptacao.id);
    }
  }, [carregarSolides]);

  async function gerarAdaptacao(event) {
    event.preventDefault();
    if (vagaDescricao.trim().length < 20) {
      setMessage("Cole a descrição completa da vaga.");
      return;
    }

    setBusy(true);
    setMessage("");

    const payload = {
      vaga_titulo: vagaTitulo.trim(),
      vaga_descricao: vagaDescricao.trim(),
    };

    try {
      if (gerarSolides) {
        const res = await fetch("/api/curriculo/solides/pacote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.detail);

        const sections = parsePreviewSections(data.preview ?? "");
        const nova = {
          ...data.segmentacao,
          portal: "solides",
          _sections: sections,
        };
        setAdaptacoes((prev) => [nova, ...prev]);
        setVagaTitulo("");
        setVagaDescricao("");
        setSolidesPreview(data.preview ?? "");
        setMessage("Perfil Sólides gerado.");
        abrirAdaptacao(nova, sections);
        setViewTab("solides");
        return;
      }

      const res = await fetch("/api/curriculo/vaga/pacote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, gerar_pdf: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail);

      const nova = { ...data.segmentacao, _sections: data.sections ?? [] };
      setAdaptacoes((prev) => [nova, ...prev]);
      setVagaTitulo("");
      setVagaDescricao("");
      setMessage("Currículo ATS gerado.");
      abrirAdaptacao(nova, data.sections ?? []);
    } catch (err) {
      setMessage(err.message || "Erro ao gerar");
    } finally {
      setBusy(false);
    }
  }

  function parsePreviewSections(raw) {
    const cleaned = String(raw ?? "").trim();
    const parts = cleaned.split(/^## /m);
    const sections = [];
    for (const part of parts.slice(1)) {
      const nl = part.indexOf("\n");
      sections.push({
        title: part.slice(0, nl).trim(),
        body: part.slice(nl + 1).trim(),
      });
    }
    return sections;
  }

  async function salvarDocumento(content) {
    if (!documentoAberto) return;

    const res = await fetch(`/api/curriculo/segmentacoes/${documentoAberto.id}/conteudo`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.detail);

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
    setSolidesDesatualizado(Boolean(solidesPreview));
  }

  async function gerarPdf() {
    if (!documentoAberto) return;

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
  }

  async function excluir(id) {
    const item = adaptacoes.find((a) => a.id === id);
    if (!window.confirm(`Excluir "${item?.vaga_titulo ?? "esta vaga"}"?`)) return;

    setDeletingId(id);
    setMessage("");

    try {
      const res = await fetch(`/api/curriculo/segmentacoes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail);

      setAdaptacoes((prev) => prev.filter((a) => a.id !== id));
      if (documentoAberto?.id === id) setDocumentoAberto(null);
      setMessage("Excluído.");
    } catch (err) {
      setMessage(err.message || "Erro ao excluir");
    } finally {
      setDeletingId(null);
    }
  }

  const msgErro =
    message.includes("Erro") || message.includes("Cole") || message.includes("descrição");

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-gradient-to-b from-zinc-100/40 via-white to-zinc-50/30">
      <header className="shrink-0 border-b border-zinc-200/60 bg-white/80 px-4 py-2.5 text-center backdrop-blur-sm sm:px-6">
        <h1 className="text-sm font-semibold tracking-tight text-zinc-900">Vaga</h1>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
        {documentoAberto ? (
          <div className="flex flex-col gap-2">
            {documentoAberto.portal !== "solides" ? (
              <div className="flex justify-center gap-1 rounded-lg border border-zinc-200/80 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setViewTab("ats")}
                  className={[
                    "rounded-md px-3 py-1.5 text-xs font-medium transition",
                    viewTab === "ats"
                      ? "bg-emerald-600 text-white"
                      : "text-zinc-600 hover:bg-zinc-50",
                  ].join(" ")}
                >
                  CV ATS
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab("solides")}
                  className={[
                    "rounded-md px-3 py-1.5 text-xs font-medium transition",
                    viewTab === "solides"
                      ? "bg-violet-600 text-white"
                      : "text-zinc-600 hover:bg-zinc-50",
                  ].join(" ")}
                >
                  Sólides
                </button>
              </div>
            ) : null}

            {viewTab === "ats" && documentoAberto.portal !== "solides" ? (
              <CvDocumentViewer
                titulo={documentoAberto.titulo}
                subtitulo={documentoAberto.subtitulo}
                preamble={null}
                sections={documentoAberto.sections}
                content={documentoAberto.content ?? ""}
                editavel
                loading={documentoAberto.loading}
                pdfUrl={documentoAberto.pdfUrl}
                temPdf={documentoAberto.temPdf}
                pdfDesatualizado={documentoAberto.pdfDesatualizado}
                onFechar={() => setDocumentoAberto(null)}
                onSalvar={salvarDocumento}
                onGerarPdf={gerarPdf}
              />
            ) : (
              <section className="flex w-full max-w-2xl flex-col">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {documentoAberto.titulo}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {documentoAberto.portal === "solides"
                        ? "Estrutura Sólides Profiler — não é o modelo ATS do cv-base"
                        : "Pacote Sólides Profiler"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDocumentoAberto(null)}
                    className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                  >
                    Fechar
                  </button>
                </div>
                <div className="overflow-hidden rounded-xl border border-violet-200/80 bg-white shadow-md ring-1 ring-violet-100">
                  <div className="h-[min(58vh,calc(100vh-14rem))] min-h-[280px]">
                    <SolidesPacoteViewer
                      preview={solidesPreview || documentoAberto.content || ""}
                      loading={solidesLoading || documentoAberto.loading}
                      gerando={solidesGerando}
                      desatualizado={solidesDesatualizado}
                      onGerar={() =>
                        gerarPacoteSolides(documentoAberto.id, {
                          vagaTitulo: documentoAberto.titulo,
                        })
                      }
                    />
                  </div>
                </div>
              </section>
            )}
          </div>
        ) : (
          <form
            onSubmit={gerarAdaptacao}
            className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm"
          >
            <input
              className={`${inputClass} mb-2`}
              placeholder="Cargo / título da vaga"
              value={vagaTitulo}
              onChange={(e) => setVagaTitulo(e.target.value)}
            />
            <textarea
              className={`${textareaClass} min-h-[10rem] text-sm`}
              placeholder="Cole a descrição da vaga…"
              value={vagaDescricao}
              onChange={(e) => setVagaDescricao(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={busy}
              className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                gerarSolides
                  ? "bg-violet-600 hover:bg-violet-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {busy ? "Gerando…" : gerarSolides ? "Gerar perfil Sólides" : "Adaptar currículo ATS"}
            </button>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-zinc-600">
              <input
                type="checkbox"
                checked={gerarSolides}
                onChange={(e) => setGerarSolides(e.target.checked)}
                className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
              />
              Formato Sólides (Profiler) — estrutura do portal, não o cv-base ATS
            </label>
          </form>
        )}

        {!documentoAberto && adaptacoes.length ? (
          <section>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Gerados
            </p>
            <ul className="flex gap-2 overflow-x-auto pb-1" role="list">
              {adaptacoes.map((item) => (
                <li key={item.id}>
                  <VagaCard
                    adaptacao={item}
                    aberto={false}
                    onAbrir={abrirAdaptacao}
                    onDelete={excluir}
                    deleting={deletingId === item.id}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {message ? (
          <p
            className={`text-center text-xs font-medium ${msgErro ? "text-red-600" : "text-emerald-700"}`}
            role="status"
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
