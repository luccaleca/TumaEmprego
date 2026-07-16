"use client";

import { useEffect, useRef, useState } from "react";
import { textareaClass } from "@/components/profile/FormField";
import { CvEstruturaLista } from "@/components/curriculo/CvEstruturaSecoes";

function inlineMd(text) {
  const parts = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m;
  const s = String(text ?? "");
  while ((m = re.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    parts.push(
      <strong key={`${m.index}-${m[1]}`} className="font-semibold text-zinc-900">
        {m[1]}
      </strong>,
    );
    last = m.index + m[0].length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts.length ? parts : s;
}

/** Prévia legível: lists, ### e **negrito** (regra tech — uso). */
function CvMarkdownBody({ text }) {
  const lines = String(text ?? "").split("\n");
  const blocks = [];
  let list = [];

  function flushList() {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="my-1.5 list-disc space-y-1.5 pl-4">
        {list.map((item, i) => (
          <li key={i} className="text-sm leading-snug text-zinc-700">
            {inlineMd(item)}
          </li>
        ))}
      </ul>,
    );
    list = [];
  }

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      flushList();
      continue;
    }
    if (t.startsWith("### ")) {
      flushList();
      blocks.push(
        <p key={`h-${blocks.length}`} className="mt-2 text-sm font-semibold text-zinc-900">
          {inlineMd(t.slice(4))}
        </p>,
      );
      continue;
    }
    if (t.startsWith("- ")) {
      list.push(t.slice(2));
      continue;
    }
    flushList();
    blocks.push(
      <p key={`p-${blocks.length}`} className="text-sm leading-relaxed text-zinc-700">
        {inlineMd(t)}
      </p>,
    );
  }
  flushList();
  return <div className="space-y-0.5">{blocks}</div>;
}

function CvSection({ title, body }) {
  return (
    <details className="overflow-hidden rounded-lg border border-zinc-200/80 bg-zinc-50/40" open>
      <summary className="cursor-pointer list-none px-3 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
        <p className="text-sm font-medium text-zinc-800">{title}</p>
      </summary>
      <div className="border-t border-zinc-100 px-3 py-2.5">
        <CvMarkdownBody text={body} />
      </div>
    </details>
  );
}

function CvPreamble({ text }) {
  const clean = String(text ?? "").trim();
  if (!clean) return null;

  return (
    <div className="rounded-lg border border-zinc-200/80 bg-white px-3 py-2.5">
      <CvMarkdownBody text={clean} />
    </div>
  );
}

function urlDownloadPdf(pdfUrl) {
  if (!pdfUrl) return "";
  const sep = pdfUrl.includes("?") ? "&" : "?";
  return `${pdfUrl}${sep}download=1`;
}

export default function CvDocumentViewer({
  titulo,
  subtitulo,
  onFechar,
  pdfUrl = null,
  temPdf = false,
  pdfDesatualizado = false,
  preamble = "",
  sections = null,
  content = "",
  editavel = false,
  modoEstrutura = false,
  onSalvar,
  onGerarPdf,
  onExcluir,
  loading = false,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmExcluir, setConfirmExcluir] = useState(false);
  const [message, setMessage] = useState("");
  const [modoVisao, setModoVisao] = useState("texto");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const snapshotRef = useRef(null);
  const aguardandoPdfRef = useRef(false);

  useEffect(() => {
    setEditing(false);
    setConfirmExcluir(false);
    setMessage("");
    setModoVisao("texto");
    setPdfPreviewUrl(null);
    aguardandoPdfRef.current = false;
  }, [titulo]);

  useEffect(() => {
    if (!editing) {
      setDraft(content);
    }
  }, [content, editing]);

  useEffect(() => {
    if (aguardandoPdfRef.current && pdfUrl) {
      aguardandoPdfRef.current = false;
      setPdfPreviewUrl(null);
      setModoVisao("pdf");
      setMessage("PDF pronto.");
    }
  }, [pdfUrl]);

  const pdfSrc = pdfPreviewUrl || pdfUrl;

  function mostrarPdf() {
    if (!pdfSrc) return;
    setModoVisao("pdf");
    setMessage("");
  }

  function mostrarTexto() {
    setModoVisao("texto");
  }

  function baixarPdf() {
    if (!pdfSrc) return;
    const a = document.createElement("a");
    a.href = urlDownloadPdf(pdfSrc);
    a.download = "Curriculo.pdf";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function iniciarEdicao() {
    snapshotRef.current = draft;
    setEditing(true);
    setModoVisao("texto");
    setMessage("");
  }

  function cancelarEdicao() {
    setDraft(snapshotRef.current ?? content);
    snapshotRef.current = null;
    setEditing(false);
    setMessage("");
  }

  async function salvarEdicao() {
    if (!onSalvar) return;

    setSaving(true);
    setMessage("");

    try {
      await onSalvar(draft);
      snapshotRef.current = null;
      setEditing(false);
      setMessage("Salvo.");
    } catch (err) {
      setMessage(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function gerarPdf() {
    if (!onGerarPdf) return;

    setGenerating(true);
    setMessage("");
    aguardandoPdfRef.current = true;

    try {
      const url = await onGerarPdf();
      if (url) {
        setPdfPreviewUrl(url);
        setModoVisao("pdf");
        setMessage("PDF pronto.");
        aguardandoPdfRef.current = false;
      }
    } catch (err) {
      aguardandoPdfRef.current = false;
      setMessage(err.message || "Erro ao gerar PDF");
    } finally {
      setGenerating(false);
    }
  }

  async function confirmarExclusao() {
    if (!onExcluir) return;

    setExcluindo(true);
    setMessage("");

    try {
      await onExcluir();
    } catch (err) {
      setMessage(err.message || "Erro ao excluir");
      setConfirmExcluir(false);
    } finally {
      setExcluindo(false);
    }
  }

  const msgErro =
    message &&
    !message.includes("Salvo") &&
    !message.includes("PDF pronto");

  const labelPdf = temPdf ? (pdfDesatualizado ? "Atualizar PDF" : "Gerar PDF") : "Gerar PDF";
  const vendoPdf = modoVisao === "pdf" && Boolean(pdfSrc) && !editing;

  return (
    <section aria-label={titulo} className="flex w-full max-w-2xl flex-col">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900">{titulo}</p>
          {subtitulo ? <p className="mt-0.5 text-xs text-zinc-500">{subtitulo}</p> : null}
          {pdfDesatualizado && editavel && temPdf ? (
            <p className="mt-0.5 text-[10px] text-amber-600">PDF desatualizado</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {!editing && !confirmExcluir && editavel && onGerarPdf ? (
            <button
              type="button"
              onClick={gerarPdf}
              disabled={loading || generating}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
            >
              {generating ? "Gerando…" : labelPdf}
            </button>
          ) : null}
          {!editing && !confirmExcluir && temPdf && pdfSrc && !vendoPdf ? (
            <button
              type="button"
              onClick={mostrarPdf}
              disabled={loading}
              className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Ver PDF
            </button>
          ) : null}
          {!editing && !confirmExcluir && vendoPdf ? (
            <>
              <button
                type="button"
                onClick={mostrarTexto}
                className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Texto
              </button>
              <button
                type="button"
                onClick={baixarPdf}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
              >
                Baixar
              </button>
            </>
          ) : null}
          {editavel && !editing && !confirmExcluir && !vendoPdf ? (
            <button
              type="button"
              onClick={iniciarEdicao}
              disabled={loading}
              className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Editar
            </button>
          ) : null}
          {editing ? (
            <>
              <button
                type="button"
                onClick={cancelarEdicao}
                disabled={saving}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarEdicao}
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </>
          ) : confirmExcluir ? (
            <>
              <button
                type="button"
                onClick={() => setConfirmExcluir(false)}
                disabled={excluindo}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
              >
                Não
              </button>
              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={excluindo}
                className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {excluindo ? "Excluindo…" : "Excluir"}
              </button>
            </>
          ) : (
            <>
              {onExcluir ? (
                <button
                  type="button"
                  onClick={() => setConfirmExcluir(true)}
                  disabled={loading}
                  className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Excluir
                </button>
              ) : null}
              <button
                type="button"
                onClick={onFechar}
                className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Fechar
              </button>
            </>
          )}
        </div>
      </div>

      {message ? (
        <p
          className={`mb-2 text-right text-xs font-medium ${msgErro ? "text-red-600" : "text-emerald-700"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-md ring-1 ring-zinc-200/40">
        <div className="h-[min(70vh,calc(100vh-12rem))] min-h-[320px]">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Carregando…
            </div>
          ) : editing ? (
            <textarea
              className={`${textareaClass} h-full min-h-[280px] resize-none rounded-none border-0 font-mono text-[13px] shadow-none ring-0 focus:ring-0`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
            />
          ) : vendoPdf ? (
            <iframe
              key={pdfSrc}
              src={pdfSrc}
              title="Curriculo.pdf"
              className="h-full w-full border-0 bg-zinc-100"
            />
          ) : sections?.length || preamble ? (
            <div className="h-full overflow-y-auto p-3">
              {modoEstrutura ? (
                <CvEstruturaLista preamble={preamble} sections={sections} />
              ) : (
                <div className="space-y-2">
                  {preamble ? <CvPreamble text={preamble} /> : null}
                  {sections?.map((sec) => (
                    <CvSection key={sec.title} title={sec.title} body={sec.body} />
                  ))}
                </div>
              )}
            </div>
          ) : pdfSrc ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <button
                type="button"
                onClick={mostrarPdf}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Ver PDF
              </button>
              <button
                type="button"
                onClick={baixarPdf}
                className="text-xs font-medium text-emerald-700 hover:underline"
              >
                Baixar Curriculo.pdf
              </button>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Sem conteúdo disponível.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
