"use client";

import { useRef, useState } from "react";
import CvPdfThumbnail from "@/components/curriculo/CvPdfThumbnail";
import CvTextThumbnail from "@/components/curriculo/CvTextThumbnail";
import { formatDateTime, formatFileSize } from "@/lib/format";

const ACCEPT = ".pdf,.md,.txt,.markdown";

function isPdf(file) {
  return file?.name?.toLowerCase().endsWith(".pdf");
}

function isText(file) {
  const name = file?.name?.toLowerCase() ?? "";
  return name.endsWith(".md") || name.endsWith(".txt") || name.endsWith(".markdown");
}

function IconDocumento({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

export default function CvDropZone({ initialArquivo, initialPreviewText, onUploaded, compact = false }) {
  const inputRef = useRef(null);
  const [arquivo, setArquivo] = useState(initialArquivo);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewText, setPreviewText] = useState(
    initialArquivo ? null : initialPreviewText || null,
  );
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const pdfSrc =
    previewFile ||
    (arquivo
      ? `/api/curriculo/thumbnail?v=${encodeURIComponent(arquivo.updatedAt)}`
      : null);

  const hasPreview = Boolean(pdfSrc || previewText);

  async function uploadFile(file) {
    if (!file) return;

    setUploading(true);
    setMessage("");

    if (isPdf(file)) {
      setPreviewFile(file);
      setPreviewText(null);
    } else if (isText(file)) {
      try {
        setPreviewText(await file.text());
      } catch {
        setPreviewText(null);
      }
      setPreviewFile(null);
    }

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/curriculo/upload", { method: "POST", body });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao enviar");

      if (data.type === "pdf") {
        if (data.file) setArquivo(data.file);
        setPreviewFile(null);
        setPreviewText(null);
      } else if (data.type === "markdown" && data.content) {
        setPreviewText(data.content);
        setPreviewFile(null);
      }

      onUploaded?.(data);
      setMessage(
        data.type === "pdf"
          ? "PDF salvo em dados/curriculo/principal.pdf"
          : "Texto importado para dados/cv-base.md",
      );
    } catch (err) {
      if (isPdf(file)) setPreviewFile(null);
      if (isText(file)) setPreviewText(null);
      setMessage(err.message || "Erro ao enviar");
    } finally {
      setUploading(false);
      setDragging(false);
    }
  }

  function onInputChange(event) {
    uploadFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function onDragOver(event) {
    event.preventDefault();
    setDragging(true);
  }

  function onDragLeave(event) {
    event.preventDefault();
    setDragging(false);
  }

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    uploadFile(event.dataTransfer.files?.[0]);
  }

  function openPicker() {
    if (!uploading) inputRef.current?.click();
  }

  const isError = message && !message.includes("salvo") && !message.includes("importado");

  return (
    <div className={compact ? "w-full p-2" : "w-full p-3 sm:p-4"}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={onInputChange}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          "flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition outline-none",
          "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
          hasPreview ? "border-zinc-200/80 bg-zinc-50/50 px-3 py-2" : compact ? "px-3 py-3" : "px-4 py-8",
          dragging
            ? "border-emerald-400 bg-emerald-50/90"
            : hasPreview
              ? ""
              : "border-zinc-200 bg-gradient-to-b from-zinc-50/50 to-white hover:border-emerald-300 hover:from-emerald-50/30",
          uploading ? "cursor-wait opacity-80" : "cursor-pointer",
        ].join(" ")}
      >
        {hasPreview ? (
          <div className="flex w-full items-center gap-3">
            {pdfSrc ? (
              <CvPdfThumbnail src={pdfSrc} compact={compact} />
            ) : (
              <CvTextThumbnail text={previewText} compact={compact} />
            )}

            <div className="min-w-0 flex-1 text-left">
              {arquivo ? (
                <>
                  <p className="truncate text-sm font-medium text-zinc-900">{arquivo.name}</p>
                  <p className="text-[11px] text-zinc-500">
                    {formatFileSize(arquivo.size)} · {formatDateTime(arquivo.updatedAt)}
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-zinc-900">
                  {uploading ? "Enviando…" : "Prévia do currículo"}
                </p>
              )}
              <p className="text-[11px] text-zinc-500">
                {uploading ? "Aguarde…" : "Clique ou arraste para substituir"}
              </p>
              {pdfSrc && arquivo ? (
                <a
                  href={`/api/curriculo/arquivo?v=${encodeURIComponent(arquivo.updatedAt)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="mt-1 inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100"
                >
                  Abrir PDF
                </a>
              ) : null}
            </div>
          </div>
        ) : compact ? (
          <div className="flex w-full items-center justify-between gap-3 text-left">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <IconDocumento className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900">
                  {uploading ? "Enviando…" : "Arraste ou escolha o arquivo"}
                </p>
                <p className="text-[11px] text-zinc-500">PDF, Markdown ou texto</p>
              </div>
            </div>
            {!uploading ? (
              <span className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                Escolher
              </span>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <IconDocumento className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-900">
              {uploading ? "Enviando…" : "Arraste o currículo aqui"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">PDF, Markdown ou texto — até 10 MB</p>
            {!uploading ? (
              <span className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-emerald-700">
                Escolher arquivo
              </span>
            ) : null}
          </div>
        )}
      </div>

      {message ? (
        <p
          className={`${compact ? "mt-1.5" : "mt-3"} text-center text-[11px] font-medium ${isError ? "text-red-600" : "text-emerald-700"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
