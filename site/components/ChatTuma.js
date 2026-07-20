"use client";

import { useEffect, useRef, useState } from "react";

export default function ChatTuma() {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [busy, setBusy] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const fimRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, aberto]);

  useEffect(() => {
    if (aberto) inputRef.current?.focus();
  }, [aberto]);

  async function enviar(event) {
    event?.preventDefault?.();
    const pergunta = texto.trim();
    if (!pergunta || busy) return;

    const idUser = `u-${Date.now()}`;
    setMensagens((prev) => [...prev, { id: idUser, role: "user", text: pergunta }]);
    setTexto("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta }),
      });
      const raw = await res.text();
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(
          res.status === 404
            ? "Chat indisponível — reinicie o site (npm run dev)."
            : "Resposta inválida do servidor.",
        );
      }
      if (!res.ok) throw new Error(data?.error || data?.detail || "Erro");

      setMensagens((prev) => [
        ...prev,
        { id: `b-${Date.now()}`, role: "bot", text: data.texto || "—" },
      ]);
    } catch (err) {
      setMensagens((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "bot",
          text: err.message || "Não respondeu.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function copiarUltima() {
    const ultima = [...mensagens].reverse().find((m) => m.role === "bot");
    if (!ultima?.text) return;
    try {
      await navigator.clipboard.writeText(ultima.text);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      {aberto ? (
        <section
          className="pointer-events-auto flex h-[min(28rem,70vh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/15"
          aria-label="Sobre mim"
        >
          <header className="flex items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-900 px-3 py-2.5 text-white">
            <p className="truncate text-sm font-semibold">Sobre mim</p>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={copiarUltima}
                className="rounded-lg px-2 py-1 text-[10px] font-medium text-zinc-200 hover:bg-white/10"
                title="Copiar"
              >
                Copiar
              </button>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="rounded-lg px-2 py-1 text-sm text-zinc-200 hover:bg-white/10"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-2 overflow-y-auto bg-zinc-50 px-3 py-3">
            {mensagens.map((m) => (
              <div
                key={m.id}
                className={[
                  "max-w-[92%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "ml-auto bg-emerald-600 text-white"
                    : "mr-auto border border-zinc-200 bg-white text-zinc-800",
                ].join(" ")}
              >
                {m.text}
              </div>
            ))}
            {busy ? <p className="text-[11px] text-zinc-400">…</p> : null}
            <div ref={fimRef} />
          </div>

          <form onSubmit={enviar} className="border-t border-zinc-100 bg-white p-2">
            <div className="flex gap-1.5">
              <textarea
                ref={inputRef}
                rows={2}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    enviar(e);
                  }
                }}
                placeholder="Pergunta sobre mim…"
                className="min-h-[2.5rem] flex-1 resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-[12px] text-zinc-900 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                disabled={busy}
              />
              <button
                type="submit"
                disabled={busy || !texto.trim()}
                className="self-end rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                Enviar
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/25 transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        aria-label={aberto ? "Fechar" : "Sobre mim"}
        aria-expanded={aberto}
      >
        {aberto ? (
          <span className="text-xl leading-none">×</span>
        ) : (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M4 4h16a2 2 0 012 2v9a2 2 0 01-2 2H9l-5 4v-4H4a2 2 0 01-2-2V6a2 2 0 012-2zm3 5a1 1 0 100 2h10a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7z" />
          </svg>
        )}
      </button>
    </div>
  );
}
