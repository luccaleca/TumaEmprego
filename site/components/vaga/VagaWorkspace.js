"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { inputClass, textareaClass } from "@/components/profile/FormField";
import { empresaCurtaCv, labelCvVaga } from "@/lib/cvSegmentoTema";

export default function VagaWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vagaTitulo, setVagaTitulo] = useState("");
  const [vagaEmpresa, setVagaEmpresa] = useState("");
  const [vagaDescricao, setVagaDescricao] = useState("");
  const [vagaUrl, setVagaUrl] = useState("");
  const [segmentoSlug, setSegmentoSlug] = useState("");
  const [portalDetectado, setPortalDetectado] = useState(null);
  const [busy, setBusy] = useState(false);
  const [busySalvar, setBusySalvar] = useState(false);
  const [message, setMessage] = useState("");
  const [rascunho, setRascunho] = useState(null);
  const gerandoRef = useRef(false);
  const prefillFeito = useRef(false);

  useEffect(() => {
    if (prefillFeito.current) return;
    const titulo = searchParams.get("titulo");
    const empresa = searchParams.get("empresa");
    const url = searchParams.get("url");
    const descricao = searchParams.get("descricao");
    const segmento = searchParams.get("segmento");
    if (!titulo && !empresa && !url && !descricao && !segmento) return;
    prefillFeito.current = true;
    if (titulo) setVagaTitulo(titulo);
    if (empresa) setVagaEmpresa(empresa);
    if (url) setVagaUrl(url);
    if (descricao) setVagaDescricao(descricao);
    if (segmento) setSegmentoSlug(segmento);
  }, [searchParams]);

  useEffect(() => {
    const url = vagaUrl.trim();    if (!url) {
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
      } catch {
        if (!cancelado) setPortalDetectado(null);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [vagaUrl]);

  function tituloRascunho(data) {
    return labelCvVaga({
      origem: "vaga",
      vaga_titulo: data?.vaga_titulo || vagaTitulo.trim(),
      vaga_empresa: data?.vaga_empresa || vagaEmpresa.trim(),
      vaga_url: data?.vaga_url || vagaUrl.trim(),
    });
  }

  async function gerarAdaptacao(event) {
    event.preventDefault();
    if (gerandoRef.current || busy || busySalvar) return;
    if (vagaDescricao.trim().length < 20) {
      setMessage("Cole a descrição completa da vaga.");
      return;
    }

    gerandoRef.current = true;
    setBusy(true);
    setMessage("");
    setRascunho(null);

    const payload = {
      vaga_titulo: vagaTitulo.trim(),
      vaga_empresa: vagaEmpresa.trim(),
      vaga_descricao: vagaDescricao.trim(),
      vaga_url: vagaUrl.trim(),
      formato: "ats",
      salvar: false,
      gerar_pdf: false,
      ...(segmentoSlug.trim() ? { segmento_slug: segmentoSlug.trim() } : {}),
    };

    try {
      const res = await fetch("/api/curriculo/vaga/pacote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail);

      setRascunho({
        titulo: tituloRascunho(data),
        preview: data.preview || "",
        segmento_label: data.segmento_label || "",
        payload,
      });
      setMessage("Revise e salve no Currículo.");
    } catch (err) {
      setMessage(err.message || "Não gerou");
    } finally {
      gerandoRef.current = false;
      setBusy(false);
    }
  }

  async function salvarNoCurriculo() {
    if (!rascunho?.payload || busySalvar) return;
    setBusySalvar(true);
    setMessage("");

    try {
      const res = await fetch("/api/curriculo/vaga/pacote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rascunho.payload,
          salvar: true,
          gerar_pdf: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail);

      const id = data.segmentacao_id ?? data.segmentacao?.id;
      if (!id) throw new Error("Não salvou no Currículo");

      setRascunho((prev) =>
        prev
          ? {
              ...prev,
              salvo: true,
              segmentacaoId: id,
              titulo: tituloRascunho(data),
            }
          : prev,
      );
      setMessage("Salvo em Currículo · origem Vaga.");
    } catch (err) {
      setMessage(err.message || "Não salvou");
    } finally {
      setBusySalvar(false);
    }
  }

  const msgErro =
    message.includes("Erro") ||
    message.includes("Cole") ||
    message.includes("descrição") ||
    message.includes("Não");

  const empCurta = empresaCurtaCv(vagaEmpresa, { vaga_url: vagaUrl });

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
            <p className="mb-2 text-[11px] text-zinc-500">{portalDetectado.portal_nome}</p>
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
          <button
            type="submit"
            disabled={busy || busySalvar}
            className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? "Gerando…" : "Gerar CV"}
          </button>
        </form>

        {rascunho ? (
          <div className="rounded-xl border border-emerald-200/90 bg-white p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900">
                Vaga
              </span>
              {empCurta ? (
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700">
                  {empCurta}
                </span>
              ) : null}
              {rascunho.salvo ? (
                <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800">
                  Salvo
                </span>
              ) : null}
            </div>
            <p className="truncate text-sm font-semibold text-zinc-900">{rascunho.titulo}</p>
            {rascunho.segmento_label ? (
              <p className="mt-0.5 text-[11px] text-zinc-500">{rascunho.segmento_label}</p>
            ) : null}
            {rascunho.preview ? (
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-2.5 font-sans text-[11px] leading-relaxed text-zinc-700">
                {rascunho.preview.slice(0, 900)}
                {rascunho.preview.length > 900 ? "…" : ""}
              </pre>
            ) : null}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              {!rascunho.salvo ? (
                <button
                  type="button"
                  disabled={busySalvar}
                  onClick={salvarNoCurriculo}
                  className="flex-1 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {busySalvar ? "Salvando…" : "Salvar no Currículo"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/curriculo?id=${encodeURIComponent(rascunho.segmentacaoId)}`,
                    )
                  }
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Ver no Currículo
                </button>
              )}
            </div>
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
