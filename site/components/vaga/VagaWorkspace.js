"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { inputClass, textareaClass } from "@/components/profile/FormField";

export default function VagaWorkspace() {
  const router = useRouter();
  const [vagaTitulo, setVagaTitulo] = useState("");
  const [vagaEmpresa, setVagaEmpresa] = useState("");
  const [vagaDescricao, setVagaDescricao] = useState("");
  const [vagaUrl, setVagaUrl] = useState("");
  const [portalDetectado, setPortalDetectado] = useState(null);
  const [busy, setBusy] = useState(false);
  const [busyDesc, setBusyDesc] = useState(false);
  const [message, setMessage] = useState("");
  const [gerarSolides, setGerarSolides] = useState(false);
  const [descricaoVaga, setDescricaoVaga] = useState("");
  const [copiado, setCopiado] = useState(false);
  const gerandoRef = useRef(false);

  useEffect(() => {
    const url = vagaUrl.trim();
    if (!url) {
      setPortalDetectado(null);
      return;
    }

    let cancelado = false;
    (async () => {
      try {
        const res = await fetch(`/api/portais?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (!res.ok || cancelado) return;
        setPortalDetectado(data);
        setGerarSolides(data.portal === "solides" && data.portal_motor_ativo === true);
      } catch {
        if (!cancelado) setPortalDetectado(null);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [vagaUrl]);

  async function gerarAdaptacao(event) {
    event.preventDefault();
    if (gerandoRef.current || busy) return;
    if (vagaDescricao.trim().length < 20) {
      setMessage("Cole a descrição completa da vaga.");
      return;
    }

    gerandoRef.current = true;
    setBusy(true);
    setMessage("");

    const payload = {
      vaga_titulo: vagaTitulo.trim(),
      vaga_empresa: vagaEmpresa.trim(),
      vaga_descricao: vagaDescricao.trim(),
      vaga_url: vagaUrl.trim(),
      formato: gerarSolides ? "solides" : "auto",
      gerar_pdf: !gerarSolides,
    };

    try {
      const res = await fetch("/api/curriculo/vaga/pacote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail);

      if (data.descricao_para_vaga) {
        setDescricaoVaga(data.descricao_para_vaga);
      }

      const id = data.segmentacao_id ?? data.segmentacao?.id;
      if (id) {
        if (data.pacote?.pdf?.erro || data.pacote?.aviso_pdf) {
          setMessage(data.pacote.aviso_pdf || data.pacote.pdf.erro || "CV gerado; PDF falhou.");
        }
        router.push(`/curriculo?id=${encodeURIComponent(id)}`);
        return;
      }

      setMessage(data.so_estrutura ? "Descrição pronta." : "Gerado.");
    } catch (err) {
      setMessage(err.message || "Erro ao gerar");
    } finally {
      gerandoRef.current = false;
      setBusy(false);
    }
  }

  async function gerarDescricao() {
    if (vagaDescricao.trim().length < 20 && vagaTitulo.trim().length < 3) {
      setMessage("Cole o título ou a descrição da vaga.");
      return;
    }

    setBusyDesc(true);
    setMessage("");
    setCopiado(false);

    try {
      const res = await fetch("/api/curriculo/vaga/descricao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vaga_titulo: vagaTitulo.trim(),
          vaga_descricao: vagaDescricao.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail);
      setDescricaoVaga(data.texto || "");
      setMessage("Descrição pronta.");
    } catch (err) {
      setMessage(err.message || "Erro ao gerar descrição");
    } finally {
      setBusyDesc(false);
    }
  }

  async function copiarDescricao() {
    if (!descricaoVaga.trim()) return;
    try {
      await navigator.clipboard.writeText(descricaoVaga);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      setMessage("Não foi possível copiar.");
    }
  }

  const msgErro =
    message.includes("Erro") || message.includes("Cole") || message.includes("descrição");

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-gradient-to-b from-zinc-100/40 via-white to-zinc-50/30">
      <header className="shrink-0 border-b border-zinc-200/60 bg-white/80 px-4 py-2.5 text-center backdrop-blur-sm sm:px-6">
        <h1 className="text-sm font-semibold tracking-tight text-zinc-900">Vaga</h1>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-3 px-4 py-4 sm:px-6">
        <form
          onSubmit={gerarAdaptacao}
          className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm"
        >
          <input
            className={`${inputClass} mb-2`}
            placeholder="URL da vaga"
            value={vagaUrl}
            onChange={(e) => setVagaUrl(e.target.value)}
          />
          {portalDetectado?.portal_nome ? (
            <p className="mb-2 text-[11px] text-violet-700">{portalDetectado.portal_nome}</p>
          ) : null}
          <input
            className={`${inputClass} mb-2`}
            placeholder="Empresa"
            value={vagaEmpresa}
            onChange={(e) => setVagaEmpresa(e.target.value)}
          />
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
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={busy || busyDesc}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                gerarSolides
                  ? "bg-violet-600 hover:bg-violet-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {busy ? "Gerando…" : gerarSolides ? "Gerar Sólides" : "Gerar ATS"}
            </button>
            <button
              type="button"
              disabled={busy || busyDesc}
              onClick={gerarDescricao}
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
            >
              {busyDesc ? "Gerando…" : "Gerar descrição"}
            </button>
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-zinc-600">
            <input
              type="checkbox"
              checked={gerarSolides}
              onChange={(e) => setGerarSolides(e.target.checked)}
              className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
            />
            Sólides
          </label>
        </form>

        {descricaoVaga ? (
          <div className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-zinc-800">Descrição</p>
              <button
                type="button"
                onClick={copiarDescricao}
                className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-200"
              >
                {copiado ? "Copiado" : "Copiar"}
              </button>
            </div>
            <textarea
              className={`${textareaClass} min-h-[8rem] text-sm`}
              value={descricaoVaga}
              onChange={(e) => setDescricaoVaga(e.target.value)}
            />
          </div>
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
