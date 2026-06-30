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

export default function CvDropZone({ initialArquivo, initialPreviewText, onUploaded }) {
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
    <div className="w-full">
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
          "flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-4 text-center transition outline-none",
          "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
          dragging
            ? "border-emerald-500 bg-emerald-50/80"
            : "border-zinc-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/30",
          uploading ? "cursor-wait opacity-80" : "cursor-pointer",
        ].join(" ")}
      >
        {hasPreview ? (
          <div className="flex items-center gap-4">
            {pdfSrc ? <CvPdfThumbnail src={pdfSrc} /> : <CvTextThumbnail text={previewText} />}

            <div className="min-w-0 flex-1 text-left">
              {arquivo ? (
                <>
                  <p className="truncate text-sm font-medium text-zinc-900">{arquivo.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {formatFileSize(arquivo.size)} · {formatDateTime(arquivo.updatedAt)}
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-zinc-900">
                  {uploading ? "Enviando…" : "Prévia do currículo"}
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                {uploading ? "Aguarde…" : "Clique ou arraste para substituir"}
              </p>
              {pdfSrc && arquivo ? (
                <a
                  href={`/api/curriculo/arquivo?v=${encodeURIComponent(arquivo.updatedAt)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="mt-1 inline-block text-xs font-medium text-emerald-700 underline-offset-2 hover:underline"
                >
                  Abrir PDF
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="py-1">
            <p className="text-sm font-medium text-zinc-900">
              {uploading ? "Enviando…" : "Arraste o currículo aqui"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">PDF, Markdown ou texto — até 10 MB</p>
            {!uploading ? (
              <span className="mt-2 inline-block rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white">
                Escolher arquivo
              </span>
            ) : null}
          </div>
        )}
      </div>

      {message ? (
        <p
          className={`mt-2 text-center text-xs font-medium ${isError ? "text-red-600" : "text-emerald-700"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
