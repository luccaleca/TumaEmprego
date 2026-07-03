"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CvSegmentacaoCard from "@/components/curriculo/CvSegmentacaoCard";
import { inputClass, textareaClass } from "@/components/profile/FormField";
import { labelSegmento } from "@/lib/cvSegmentoTema";

const ACCEPT = ".pdf,.md,.txt,.markdown";

function CvAddCard({ active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      aria-label="Adicionar variação"
      title="Adicionar variação"
      className={[
        "flex h-[168px] w-11 shrink-0 items-center justify-center rounded-xl border border-dashed bg-white transition",
        active
          ? "border-emerald-400 bg-emerald-50/50 text-emerald-700"
          : "border-zinc-300 text-zinc-400 hover:border-emerald-300 hover:bg-emerald-50/30 hover:text-emerald-600",
      ].join(" ")}
    >
      <span className="text-xl font-light leading-none">+</span>
    </button>
  );
}

export default function CvRamificacoes({
  initialSegmentacoes = [],
  sectionsUpdate = null,
  metaUpdate = null,
  documentoAbertoId = null,
  onAbrirDocumento,
  onDocumentoRemovido,
}) {
  const [segmentacoes, setSegmentacoes] = useState(initialSegmentacoes);
  const [painel, setPainel] = useState(null);

  useEffect(() => {
    setSegmentacoes(initialSegmentacoes);
  }, [initialSegmentacoes]);

  useEffect(() => {
    if (!sectionsUpdate?.id) return;
    setSegmentacoes((prev) =>
      prev.map((seg) =>
        seg.id === sectionsUpdate.id ? { ...seg, _sections: sectionsUpdate.sections } : seg,
      ),
    );
  }, [sectionsUpdate]);

  useEffect(() => {
    if (!metaUpdate?.id || !metaUpdate.meta) return;
    setSegmentacoes((prev) =>
      prev.map((seg) => (seg.id === metaUpdate.id ? { ...seg, ...metaUpdate.meta } : seg)),
    );
  }, [metaUpdate]);
  const [vagaTitulo, setVagaTitulo] = useState("");
  const [vagaDescricao, setVagaDescricao] = useState("");
  const [manualTitulo, setManualTitulo] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  const addOpen = painel !== null;

  async function excluir(id) {
    const seg = segmentacoes.find((s) => s.id === id);
    const nome =
      seg?.origem === "busca" || seg?.origem === "segmento"
        ? labelSegmento(seg)
        : seg?.vaga_titulo ?? "esta versão";

    if (!window.confirm(`Excluir "${nome}"?`)) return;

    setDeletingId(id);
    setMessage("");

    try {
      const res = await fetch(`/api/curriculo/segmentacoes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail);

      setSegmentacoes((prev) => prev.filter((s) => s.id !== id));
      if (documentoAbertoId === id) onDocumentoRemovido?.(id);
      setMessage("Versão excluída.");
    } catch (err) {
      setMessage(err.message || "Erro ao excluir");
    } finally {
      setDeletingId(null);
    }
  }

  function adicionarSegmentacao(segmentacao, sections = []) {
    setSegmentacoes((prev) => [{ ...segmentacao, _sections: sections }, ...prev]);
    onAbrirDocumento?.(segmentacao, sections);
  }

  function toggleAdd() {
    setPainel((atual) => (atual === "menu" ? null : "menu"));
    setMessage("");
  }

  async function gerarParaVaga(event) {
    event.preventDefault();
    if (vagaDescricao.trim().length < 20) {
      setMessage("Cole a descrição completa da vaga.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const res = await fetch("/api/curriculo/vaga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vaga_titulo: vagaTitulo.trim(),
          vaga_descricao: vagaDescricao.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail);

      adicionarSegmentacao(data.segmentacao, data.sections ?? []);
      setVagaTitulo("");
      setVagaDescricao("");
      setPainel(null);
      setMessage("Versão para vaga criada.");
    } catch (err) {
      setMessage(err.message || "Erro ao gerar");
    } finally {
      setBusy(false);
    }
  }

  async function enviarManual(event) {
    event.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setMessage("Escolha um arquivo.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const body = new FormData();
      body.append("vaga_titulo", manualTitulo.trim());
      body.append("file", file);

      const res = await fetch("/api/curriculo/segmentacoes", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail);

      adicionarSegmentacao(data.segmentacao, data.sections);
      setManualTitulo("");
      if (inputRef.current) inputRef.current.value = "";
      setPainel(null);
      setMessage("Arquivo adicionado.");
    } catch (err) {
      setMessage(err.message || "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  const msgErro =
    message.includes("Erro") ||
    message.includes("Informe") ||
    message.includes("Escolha") ||
    message.includes("Cole");

  return (
    <section aria-labelledby="cv-variacoes-heading" className="w-full">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p
          id="cv-variacoes-heading"
          className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400"
        >
          Variações
        </p>
        {!segmentacoes.length && !addOpen ? (
          <p className="text-[10px] text-zinc-400">
            Nenhum segmento ativo — marque áreas em{" "}
            <Link href="/segmentos" className="text-emerald-700 hover:underline">
              Segmentos
            </Link>
          </p>
        ) : null}
      </div>

      {addOpen ? (
        <div className="mb-1.5 rounded-lg border border-zinc-200/90 bg-white p-2.5 shadow-sm">
          {painel === "menu" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-700">Nova variação</p>
                <button
                  type="button"
                  onClick={() => setPainel(null)}
                  className="text-[11px] text-zinc-400 hover:text-zinc-700"
                >
                  Fechar
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setPainel("vaga")}
                  className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-700"
                >
                  Para vaga
                </button>
                <button
                  type="button"
                  onClick={() => setPainel("manual")}
                  className="rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Arquivo
                </button>
                <Link
                  href="/segmentos"
                  className="rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Segmentos
                </Link>
              </div>
            </div>
          ) : null}

          {painel === "vaga" ? (
            <form onSubmit={gerarParaVaga} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-700">Gerar para vaga</p>
                <button
                  type="button"
                  onClick={() => setPainel("menu")}
                  className="text-[11px] text-zinc-400 hover:text-zinc-700"
                >
                  Voltar
                </button>
              </div>
              <textarea
                className={`${textareaClass} min-h-[3.5rem] text-sm`}
                placeholder="Cole a descrição da vaga…"
                value={vagaDescricao}
                onChange={(e) => setVagaDescricao(e.target.value)}
                required
              />
              <input
                className={inputClass}
                placeholder="Título (opcional)"
                value={vagaTitulo}
                onChange={(e) => setVagaTitulo(e.target.value)}
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                {busy ? "Gerando…" : "Gerar"}
              </button>
            </form>
          ) : null}

          {painel === "manual" ? (
            <form onSubmit={enviarManual} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-700">Enviar arquivo</p>
                <button
                  type="button"
                  onClick={() => setPainel("menu")}
                  className="text-[11px] text-zinc-400 hover:text-zinc-700"
                >
                  Voltar
                </button>
              </div>
              <input
                className={inputClass}
                placeholder="Título (opcional)"
                value={manualTitulo}
                onChange={(e) => setManualTitulo(e.target.value)}
              />
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                required
                className="text-xs file:mr-2 file:rounded file:border-0 file:bg-emerald-50 file:px-2 file:py-1 file:text-xs file:text-emerald-800"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                {busy ? "Salvando…" : "Salvar"}
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      <ul
        className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin]"
        role="list"
      >
        <li className="shrink-0">
          <CvAddCard active={addOpen} onClick={toggleAdd} />
        </li>
        {segmentacoes.length ? (
          segmentacoes.map((seg) => (
            <li key={seg.id} className="shrink-0">
              <CvSegmentacaoCard
                segmentacao={seg}
                initialSections={seg._sections ?? null}
                aberto={documentoAbertoId === seg.id}
                onAbrirPreview={onAbrirDocumento}
                onDelete={excluir}
                deleting={deletingId === seg.id}
              />
            </li>
          ))
        ) : (
          <li className="flex h-[168px] items-center px-1 text-xs text-zinc-400">
            Nenhum segmento ativo na faixa
          </li>
        )}
      </ul>

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
