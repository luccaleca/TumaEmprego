"use client";

import { useRef, useState } from "react";
import CvSegmentacaoCard from "@/components/curriculo/CvSegmentacaoCard";
import { inputClass, textareaClass } from "@/components/profile/FormField";

const ACCEPT = ".pdf,.md,.txt,.markdown";

export default function CvRamificacoes({ initialSegmentacoes = [], compact = false }) {
  const [segmentacoes, setSegmentacoes] = useState(initialSegmentacoes);
  const [painel, setPainel] = useState(null);
  const [vagaTitulo, setVagaTitulo] = useState("");
  const [vagaDescricao, setVagaDescricao] = useState("");
  const [manualTitulo, setManualTitulo] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  function adicionarSegmentacao(segmentacao, sections = []) {
    setSegmentacoes((prev) => [{ ...segmentacao, _sections: sections }, ...prev]);
  }

  function togglePainel(tipo) {
    setPainel((atual) => (atual === tipo ? null : tipo));
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
      setMessage("Ramificação criada.");
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
      setMessage("Ramificação adicionada.");
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
    <section aria-labelledby="cv-ramificacoes-heading">
      <div>
        {!compact ? (
          <div
            className="absolute bottom-0 left-0 top-0 w-0.5 rounded-full bg-gradient-to-b from-emerald-400/80 via-emerald-200/40 to-transparent"
            aria-hidden
          />
        ) : null}

        <div className={`shrink-0 ${compact ? "mb-2" : "mb-5"}`}>
          <h2 id="cv-ramificacoes-heading" className="text-sm font-semibold text-zinc-900">
            Ramificações
          </h2>
          {!compact ? (
            <p className="mt-0.5 text-sm text-zinc-500">
              Versões do principal — por segmento, vaga ou arquivo
            </p>
          ) : null}
        </div>

        <div className={`shrink-0 ${compact ? "mb-2" : "mb-5"} inline-flex rounded-lg bg-zinc-100/90 p-0.5 ring-1 ring-zinc-200/60`}>
          <button
            type="button"
            onClick={() => togglePainel("vaga")}
            className={[
              "rounded-md px-3 py-1.5 text-xs font-medium transition",
              painel === "vaga"
                ? "bg-white text-emerald-800 shadow-sm ring-1 ring-zinc-200/80"
                : "text-zinc-600 hover:text-zinc-900",
            ].join(" ")}
          >
            Gerar para vaga
          </button>
          <button
            type="button"
            onClick={() => togglePainel("manual")}
            className={[
              "rounded-md px-3 py-1.5 text-xs font-medium transition",
              painel === "manual"
                ? "bg-white text-emerald-800 shadow-sm ring-1 ring-zinc-200/80"
                : "text-zinc-600 hover:text-zinc-900",
            ].join(" ")}
          >
            Enviar arquivo
          </button>
        </div>

        {painel === "vaga" ? (
          <form
            onSubmit={gerarParaVaga}
            className={`shrink-0 space-y-2.5 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-3 shadow-sm ${compact ? "mb-2" : "mb-5"}`}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="ram-vaga-desc" className="mb-1 block text-[11px] font-medium text-zinc-700">
                  Descrição da vaga
                </label>
                <textarea
                  id="ram-vaga-desc"
                  className={`${textareaClass} min-h-[4.5rem] text-sm`}
                  placeholder="Cole o texto completo da vaga…"
                  value={vagaDescricao}
                  onChange={(e) => setVagaDescricao(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="ram-vaga-titulo" className="mb-1 block text-[11px] font-medium text-zinc-700">
                  Título (opcional)
                </label>
                <input
                  id="ram-vaga-titulo"
                  className={inputClass}
                  placeholder="Ex.: Estágio · Analista de Dados"
                  value={vagaTitulo}
                  onChange={(e) => setVagaTitulo(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busy ? "Gerando…" : "Gerar"}
                </button>
                <button
                  type="button"
                  onClick={() => setPainel(null)}
                  className="rounded-lg px-2 py-1.5 text-xs text-zinc-600 hover:bg-white/60"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        ) : null}

        {painel === "manual" ? (
          <form
            onSubmit={enviarManual}
            className={`shrink-0 space-y-2.5 rounded-xl border border-zinc-200/90 bg-white p-3 shadow-sm ${compact ? "mb-2" : "mb-5"}`}
          >
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <label htmlFor="ram-manual-titulo" className="mb-1 block text-[11px] font-medium text-zinc-700">
                  Título (opcional)
                </label>
                <input
                  id="ram-manual-titulo"
                  className={inputClass}
                  placeholder="Ex.: CV Dados · LinkedIn"
                  value={manualTitulo}
                  onChange={(e) => setManualTitulo(e.target.value)}
                />
              </div>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                required
                className="text-xs text-zinc-600 file:mr-2 file:rounded-md file:border-0 file:bg-emerald-50 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-emerald-800 hover:file:bg-emerald-100"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy ? "Salvando…" : "Salvar"}
              </button>
              <button
                type="button"
                onClick={() => setPainel(null)}
                className="rounded-lg px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}

        {message ? (
          <p
            className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium ${compact ? "mb-2" : "mb-4"} ${msgErro ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}
            role="status"
          >
            {message}
          </p>
        ) : null}

        {segmentacoes.length ? (
          <ul className="space-y-2" role="list">
            {segmentacoes.map((seg) => (
              <li key={seg.id}>
                <CvSegmentacaoCard
                  segmentacao={seg}
                  initialSections={seg._sections ?? null}
                  compact={compact}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div
            className={`shrink-0 rounded-xl border border-dashed border-zinc-200 bg-white/60 text-center ${compact ? "px-4 py-4" : "px-6 py-10"}`}
          >
            <p className="text-xs font-medium text-zinc-600">Nenhuma ramificação ainda</p>
            <p className="mt-0.5 text-[11px] text-zinc-400">Use os botões acima ou salve em Segmentos</p>
          </div>
        )}
      </div>
    </section>
  );
}
