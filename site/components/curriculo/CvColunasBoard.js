"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CvSegmentacaoCard from "@/components/curriculo/CvSegmentacaoCard";
import { inputClass } from "@/components/profile/FormField";
import { temaSegmento } from "@/lib/cvSegmentoTema";

const ACCEPT = ".pdf,.md,.txt,.markdown";
const FILTROS_PORTAL = [
  { id: "todos", label: "Todos" },
  { id: "solides", label: "Sólides" },
  { id: "ats", label: "ATS" },
];

function passaFiltroPortal(seg, filtro) {
  if (filtro === "todos") return true;
  if (seg?.slot) return true;
  if (filtro === "solides") return seg.portal === "solides";
  if (filtro === "ats") return seg.portal !== "solides";
  return true;
}

function CvColuna({ coluna, documentoAbertoId, deletingId, onAbrir, onDelete }) {
  const tema = coluna.slug === "_outras" ? temaSegmento(null) : temaSegmento(coluna.slug);
  const candidaturas = coluna.candidaturas;
  const manuais = coluna.manuais;
  const vazio = !coluna.slot && !candidaturas.length && !manuais.length;
  const extras = [...candidaturas, ...manuais];

  return (
    <section
      className={[
        "flex min-w-0 flex-1 basis-0 flex-col rounded-md border bg-white/90 p-1.5 shadow-sm",
        tema.card,
        tema.ring,
        "ring-1",
      ].join(" ")}
      aria-label={coluna.label}
    >
      <header className="mb-1 flex items-center gap-1">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tema.header}`} aria-hidden />
        <h3 className="truncate text-[10px] font-semibold leading-tight text-zinc-900" title={coluna.label}>
          {coluna.label}
        </h3>
      </header>

      <div className="flex flex-col gap-1">
        {coluna.slot ? (
          <>
            <CvSegmentacaoCard
              segmentacao={coluna.slot}
              initialSections={coluna.slot._sections ?? null}
              aberto={documentoAbertoId === coluna.slot.id}
              onAbrirPreview={onAbrir}
              onDelete={onDelete}
              deleting={deletingId === coluna.slot.id}
            />
            {extras.length ? (
              <div className="mx-0.5 border-t border-dashed border-zinc-200/90" aria-hidden />
            ) : null}
          </>
        ) : null}

        {extras.map((seg) => (
          <CvSegmentacaoCard
            key={seg.id}
            segmentacao={seg}
            initialSections={seg._sections ?? null}
            aberto={documentoAbertoId === seg.id}
            onAbrirPreview={onAbrir}
            onDelete={onDelete}
            deleting={deletingId === seg.id}
          />
        ))}

        {vazio ? <p className="py-1.5 text-center text-[9px] text-zinc-400">—</p> : null}
      </div>
    </section>
  );
}

export default function CvColunasBoard({
  initialColunas = [],
  documentoAbertoId = null,
  onAbrirDocumento,
  onDocumentoRemovido,
  onColunasChange,
  embedded = false,
}) {
  const [colunas, setColunas] = useState(initialColunas);
  const [filtroPortal, setFiltroPortal] = useState("todos");
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [manualTitulo, setManualTitulo] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const enviandoRef = useRef(false);

  useEffect(() => {
    setColunas(initialColunas);
  }, [initialColunas]);

  const recarregar = useCallback(async () => {
    const res = await fetch("/api/curriculo/segmentacoes");
    const data = await res.json();
    if (!res.ok) return;
    setColunas(data.colunas ?? []);
    onColunasChange?.(data.colunas ?? []);
  }, [onColunasChange]);

  async function excluir(id) {
    setDeletingId(id);
    setMessage("");
    try {
      const res = await fetch(`/api/curriculo/segmentacoes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail);
      await recarregar();
      if (documentoAbertoId === id) onDocumentoRemovido?.();
      setMessage("Excluído.");
    } catch (err) {
      setMessage(err.message || "Erro ao excluir");
    } finally {
      setDeletingId(null);
    }
  }

  async function enviarManual(event) {
    event.preventDefault();
    if (enviandoRef.current || busy) return;
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    enviandoRef.current = true;
    setBusy(true);
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      if (manualTitulo.trim()) body.append("vaga_titulo", manualTitulo.trim());

      const res = await fetch("/api/curriculo/segmentacoes", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail);

      await recarregar();
      setAddOpen(false);
      setManualTitulo("");
      if (inputRef.current) inputRef.current.value = "";
      if (data.segmentacao) {
        onAbrirDocumento?.(data.segmentacao, data.sections ?? null);
      }
      setMessage("Salvo.");
    } catch (err) {
      setMessage(err.message || "Erro ao enviar");
    } finally {
      enviandoRef.current = false;
      setBusy(false);
    }
  }

  const temColunas = colunas.length > 0;
  const msgErro = message.includes("Erro") || message.includes("excluir");

  const colunasVisiveis = useMemo(() => {
    if (filtroPortal === "todos") return colunas;
    return colunas
      .map((col) => ({
        ...col,
        candidaturas: col.candidaturas.filter((s) => passaFiltroPortal(s, filtroPortal)),
        manuais: col.manuais.filter((s) => passaFiltroPortal(s, filtroPortal)),
      }))
      .filter(
        (col) =>
          col.slot ||
          col.candidaturas.length ||
          col.manuais.length ||
          col.slug === "_outras",
      );
  }, [colunas, filtroPortal]);

  return (
    <section aria-labelledby={embedded ? undefined : "cv-colunas-heading"}>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        {embedded ? (
          <span className="sr-only">Segmentos</span>
        ) : (
          <p
            id="cv-colunas-heading"
            className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400"
          >
            Segmentos
          </p>
        )}
        <div className={`flex flex-wrap items-center gap-1.5 ${embedded ? "ml-auto" : ""}`}>
          {FILTROS_PORTAL.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltroPortal(f.id)}
              className={
                filtroPortal === f.id
                  ? "rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-medium text-white"
                  : "rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-200"
              }
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAddOpen((v) => !v)}
            className="rounded-full border border-dashed border-zinc-300 px-2.5 py-0.5 text-[10px] font-medium text-zinc-600 hover:border-emerald-300 hover:text-emerald-700"
          >
            + Arquivo
          </button>
          <Link
            href="/vaga"
            className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-medium text-white hover:bg-emerald-700"
          >
            Nova vaga
          </Link>
        </div>
      </div>

      {addOpen ? (
        <form
          onSubmit={enviarManual}
          className="mb-3 rounded-lg border border-zinc-200 bg-white p-2.5 shadow-sm"
        >
          <input
            className={`${inputClass} mb-2`}
            placeholder="Título (opcional)"
            value={manualTitulo}
            onChange={(e) => setManualTitulo(e.target.value)}
          />
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            required
            className="mb-2 block w-full text-xs"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {busy ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600"
            >
              Fechar
            </button>
          </div>
        </form>
      ) : null}

      {!temColunas ? (
        <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
          Nenhuma área ativa
        </p>
      ) : (
        <div className="flex flex-nowrap gap-1.5">
          {colunasVisiveis.map((col) => (
            <CvColuna
              key={col.slug}
              coluna={col}
              documentoAbertoId={documentoAbertoId}
              deletingId={deletingId}
              onAbrir={onAbrirDocumento}
              onDelete={excluir}
            />
          ))}
        </div>
      )}

      {message ? (
        <p
          className={`mt-2 text-center text-[11px] font-medium ${msgErro ? "text-red-600" : "text-emerald-700"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
