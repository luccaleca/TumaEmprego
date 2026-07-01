"use client";

import { useRef, useState } from "react";
import CvSegmentacaoCard from "@/components/curriculo/CvSegmentacaoCard";
import { inputClass, textareaClass } from "@/components/profile/FormField";

const ACCEPT = ".pdf,.md,.txt,.markdown";

export default function CvSegmentacoes({ initialSegmentacoes = [] }) {
  const [segmentacoes, setSegmentacoes] = useState(initialSegmentacoes);
  const [formOpen, setFormOpen] = useState(false);
  const [vagaTitulo, setVagaTitulo] = useState("");
  const [vagaDescricao, setVagaDescricao] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  async function enviarManual(event) {
    event.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!vagaTitulo.trim()) {
      setMessage("Informe para qual vaga é este currículo.");
      return;
    }
    if (!file) {
      setMessage("Escolha um arquivo.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const body = new FormData();
      body.append("vaga_titulo", vagaTitulo.trim());
      body.append("vaga_descricao", vagaDescricao.trim());
      body.append("file", file);

      const res = await fetch("/api/curriculo/segmentacoes", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail);

      setSegmentacoes((prev) => [
        { ...data.segmentacao, _sections: data.sections },
        ...prev,
      ]);
      setVagaTitulo("");
      setVagaDescricao("");
      if (inputRef.current) inputRef.current.value = "";
      setFormOpen(false);
      setMessage("Currículo adicionado.");
    } catch (err) {
      setMessage(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-10 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900">Segmentações</h2>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {formOpen ? "Cancelar" : "+ Currículo manual"}
        </button>
      </div>

      {formOpen ? (
        <form
          onSubmit={enviarManual}
          className="mb-4 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4"
        >
          <div>
            <label htmlFor="vaga-titulo" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-emerald-700">
              Vaga
            </label>
            <input
              id="vaga-titulo"
              className={`${inputClass} text-base font-semibold`}
              placeholder="Ex.: Estágio · Analista de Dados — Empresa X"
              value={vagaTitulo}
              onChange={(e) => setVagaTitulo(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="vaga-desc" className="mb-1 block text-xs font-medium text-zinc-700">
              Detalhes (opcional)
            </label>
            <textarea
              id="vaga-desc"
              className={`${textareaClass} min-h-[4rem] text-sm`}
              placeholder="Link da vaga, requisitos, observações…"
              value={vagaDescricao}
              onChange={(e) => setVagaDescricao(e.target.value)}
            />
          </div>
          <div>
            <input ref={inputRef} type="file" accept={ACCEPT} className="text-xs text-zinc-600" />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar currículo"}
          </button>
        </form>
      ) : null}

      {message ? (
        <p
          className={`mb-3 text-xs font-medium ${message.includes("Erro") || message.includes("Informe") || message.includes("Escolha") ? "text-red-600" : "text-emerald-700"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      {segmentacoes.length ? (
        <ul className="space-y-4" role="list">
          {segmentacoes.map((seg) => (
            <li key={seg.id}>
              <CvSegmentacaoCard
                segmentacao={seg}
                initialSections={seg._sections ?? null}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-200 py-8 text-center text-sm text-zinc-500">
          Nenhuma segmentação ainda.
        </p>
      )}
    </section>
  );
}
