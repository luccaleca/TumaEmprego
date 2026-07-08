"use client";

import { useEffect, useRef, useState } from "react";
import { textareaClass } from "@/components/profile/FormField";
import { CvEstruturaLista } from "@/components/curriculo/CvEstruturaSecoes";

function CvSection({ title, body }) {
  return (
    <details className="overflow-hidden rounded-lg border border-zinc-200/80 bg-zinc-50/40" open>
      <summary className="cursor-pointer list-none px-3 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
        <p className="text-sm font-medium text-zinc-800">{title}</p>
      </summary>
      <div className="border-t border-zinc-100 px-3 py-2.5">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-700">
          {body}
        </pre>
      </div>
    </details>
  );
}

function CvPreamble({ text }) {
  const clean = String(text ?? "").trim();
  if (!clean) return null;

  return (
    <div className="rounded-lg border border-zinc-200/80 bg-white px-3 py-2.5">
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-800">
        {clean}
      </pre>
    </div>
  );
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
  loading = false,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const snapshotRef = useRef(null);

  useEffect(() => {
    setEditing(false);
    setMessage("");
  }, [titulo, pdfUrl]);

  useEffect(() => {
    if (!editing) {
      setDraft(content);
    }
  }, [content, editing]);

  function abrirPdf() {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  }

  function iniciarEdicao() {
    snapshotRef.current = draft;
    setEditing(true);
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

    try {
      await onGerarPdf();
      setMessage("PDF gerado.");
    } catch (err) {
      setMessage(err.message || "Erro ao gerar PDF");
    } finally {
      setGenerating(false);
    }
  }

  const msgErro =
    message &&
    !message.includes("Salvo") &&
    !message.includes("PDF gerado");

  const labelPdf = temPdf ? (pdfDesatualizado ? "Atualizar PDF" : "Gerar PDF") : "Gerar PDF";

  return (
    <section aria-label={titulo} className="flex w-full max-w-2xl flex-col">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900">{titulo}</p>
          {subtitulo ? <p className="mt-0.5 text-xs text-zinc-500">{subtitulo}</p> : null}
          {pdfDesatualizado && editavel && temPdf ? (
            <p className="mt-0.5 text-[10px] text-amber-600">
              Texto base atualizado — o PDF enviado está desatualizado. Use &quot;Atualizar PDF&quot; para
              alinhar.
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {!editing && editavel && onGerarPdf ? (
            <button
              type="button"
              onClick={gerarPdf}
              disabled={loading || generating}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
            >
              {generating ? "Gerando…" : labelPdf}
            </button>
          ) : null}
          {!editing && temPdf && pdfUrl ? (
            <button
              type="button"
              onClick={abrirPdf}
              disabled={loading}
              className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Ver PDF
            </button>
          ) : null}
          {editavel && !editing ? (
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
          ) : (
            <button
              type="button"
              onClick={onFechar}
              className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Fechar
            </button>
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
        <div className="h-[min(58vh,calc(100vh-14rem))] min-h-[280px]">
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
          ) : pdfUrl && !editavel ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-zinc-600">Currículo disponível em PDF</p>
              <button
                type="button"
                onClick={abrirPdf}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Abrir PDF
              </button>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Sem conteúdo disponível.
            </div>
          )}
        </div>
      </div>

      {!editavel && pdfUrl ? (
        <p className="mt-2 text-center text-[11px] text-zinc-400">
          Variação só em PDF — envie Markdown para editar por texto.
        </p>
      ) : null}
    </section>
  );
}
