"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { labelPortal } from "@/lib/portalLabels";
import { temaSegmento } from "@/lib/cvSegmentoTema";

const STATUS_FALLBACK = [
  { id: "enviado", label: "Enviado" },
  { id: "retorno", label: "Retorno" },
];

const COLUNA_TOM = {
  pronto: {
    barra: "bg-amber-500",
    cabe: "bg-amber-50 text-amber-950 border-amber-200/80",
  },
  enviado: {
    barra: "bg-sky-500",
    cabe: "bg-sky-50 text-sky-950 border-sky-200/80",
  },
  retorno: {
    barra: "bg-emerald-500",
    cabe: "bg-emerald-50 text-emerald-950 border-emerald-200/80",
  },
};

function CardCandidatura({
  item,
  statusLista,
  statusAtual,
  onStatus,
  onRemover,
  busyId,
  compacto = false,
}) {
  const tema = temaSegmento(item.segmento_slug);
  const portal = labelPortal(item.portal);
  const busy = busyId === item.id;
  const outros = statusLista.filter((s) => s.id !== statusAtual);

  return (
    <article
      className={[
        "overflow-hidden rounded-lg border bg-white shadow-sm",
        tema.card,
        tema.ring,
        "ring-1",
      ].join(" ")}
    >
      <div className={`h-0.5 ${tema.header}`} aria-hidden />
      <div className={compacto ? "flex flex-col gap-1 p-1.5" : "flex flex-col gap-1.5 p-2"}>
        <div className={compacto ? "flex min-w-0 items-center gap-1.5" : "flex min-w-0 items-center gap-2"}>
          {item.logo_url ? (
            <img
              src={item.logo_url}
              alt=""
              className={
                compacto
                  ? "h-7 w-7 shrink-0 rounded-md object-cover ring-1 ring-zinc-200"
                  : "h-8 w-8 shrink-0 rounded-md object-cover ring-1 ring-zinc-200"
              }
            />
          ) : (
            <span
              className={`flex ${
                compacto ? "h-7 w-7 text-[9px]" : "h-8 w-8 text-[10px]"
              } shrink-0 items-center justify-center rounded-md font-bold ${tema.badge}`}
              aria-hidden
            >
              {(item.empresa || item.vaga_titulo || "?").slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p
              className={`truncate ${compacto ? "text-[11px]" : "text-xs"} font-semibold text-zinc-900`}
              title={item.empresa || undefined}
            >
              {item.empresa || "Empresa"}
            </p>
            <p
              className={`truncate ${compacto ? "text-[9px]" : "text-[10px]"} leading-snug text-zinc-600`}
              title={item.vaga_titulo}
            >
              {item.vaga_titulo || "Vaga"}
            </p>
          </div>
        </div>

        <div className={`flex flex-wrap items-center gap-1 ${compacto ? "text-[8px]" : "text-[9px]"} text-zinc-500`}>
          {portal ? (
            <span className="rounded bg-zinc-100 px-1 py-px font-medium text-zinc-600">
              {portal}
            </span>
          ) : null}
          <span className="truncate">{formatDateTime(item.atualizado_em || item.criado_em)}</span>
        </div>

        {outros.length ? (
          <div className={compacto ? "flex flex-wrap gap-0.5" : "flex flex-wrap gap-1"}>
            {outros.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={busy}
                onClick={() => onStatus(item.id, s.id)}
                className={`rounded-full bg-zinc-100 ${
                  compacto ? "px-1 py-0.5 text-[8px]" : "px-1.5 py-0.5 text-[9px]"
                } font-medium text-zinc-600 hover:bg-zinc-200 disabled:opacity-50`}
              >
                → {s.label}
              </button>
            ))}
          </div>
        ) : null}

        <div
          className={`flex items-center justify-between gap-2 border-t border-zinc-100/90 ${
            compacto ? "pt-1" : "pt-1.5"
          }`}
        >
          {item.segmentacao_id ? (
            <Link
              href={`/curriculo?id=${encodeURIComponent(item.segmentacao_id)}`}
              className={`${compacto ? "text-[9px]" : "text-[10px]"} font-medium text-emerald-700 hover:underline`}
            >
              CV
            </Link>
          ) : item.vaga_url ? (
            <a
              href={item.vaga_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`truncate ${compacto ? "text-[9px]" : "text-[10px]"} font-medium text-zinc-500 hover:text-zinc-800`}
            >
              Vaga
            </a>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => onRemover(item.id)}
            className={`${compacto ? "text-[9px]" : "text-[10px]"} font-medium text-zinc-400 hover:text-red-600 disabled:opacity-50`}
          >
            Remover
          </button>
        </div>
      </div>
    </article>
  );
}

function ColunaStatus({ status, itens, statusLista, onStatus, onRemover, busyId }) {
  const tom = COLUNA_TOM[status.id] ?? COLUNA_TOM.enviado;
  const compacto = status.id === "enviado";

  return (
    <section
      className={[
        "flex w-[min(100%,16.5rem)] shrink-0 flex-col rounded-xl border border-zinc-200/90 bg-zinc-50/80",
        "lg:w-auto lg:min-w-0 lg:flex-1",
      ].join(" ")}
      aria-label={status.label}
    >
      <header
        className={`flex items-center justify-between gap-2 rounded-t-[0.65rem] border-b px-2.5 py-2 ${tom.cabe}`}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tom.barra}`} aria-hidden />
          <h2 className="truncate text-xs font-semibold">{status.label}</h2>
        </div>
        <span className="rounded-full bg-white/80 px-1.5 py-px text-[10px] font-semibold tabular-nums text-zinc-700 ring-1 ring-black/5">
          {itens.length}
        </span>
      </header>

      <div
        className={`flex max-h-[min(70vh,36rem)] flex-col overflow-y-auto ${
          compacto ? "gap-1 p-1" : "gap-1.5 p-1.5"
        }`}
      >
        {itens.length ? (
          itens.map((item) => (
            <CardCandidatura
              key={item.id}
              item={item}
              statusAtual={status.id}
              statusLista={statusLista}
              onStatus={onStatus}
              onRemover={onRemover}
              busyId={busyId}
              compacto={compacto}
            />
          ))
        ) : (
          <p className="px-1 py-6 text-center text-[10px] text-zinc-400">—</p>
        )}
      </div>
    </section>
  );
}

export default function AcompanhamentoBoard({ initial = [] }) {
  const [itens, setItens] = useState(initial);
  const [statusLista, setStatusLista] = useState(STATUS_FALLBACK);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(!initial?.length);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/candidaturas");
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error);
      setItens(data.candidaturas ?? []);
      if (data.status?.length) {
        const filtrados = (data.status ?? []).filter((s) => s.id !== "pronto");
        setStatusLista(filtrados.length ? filtrados : STATUS_FALLBACK);
      }
    } catch (err) {
      setMessage(err.message || "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const porStatus = useMemo(() => {
    const map = Object.fromEntries(statusLista.map((s) => [s.id, []]));
    for (const item of itens) {
      const key = map[item.status] ? item.status : statusLista[0]?.id;
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return map;
  }, [itens, statusLista]);

  async function mudarStatus(id, status) {
    setBusyId(id);
    setMessage("");
    try {
      const res = await fetch("/api/candidaturas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error);
      setItens((prev) => prev.map((c) => (c.id === id ? data.candidatura : c)));
    } catch (err) {
      setMessage(err.message || "Erro ao atualizar");
    } finally {
      setBusyId(null);
    }
  }

  async function remover(id) {
    if (!window.confirm("Remover esta candidatura?")) return;
    setBusyId(id);
    setMessage("");
    try {
      const res = await fetch(`/api/candidaturas?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error);
      setItens((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setMessage(err.message || "Erro ao remover");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-zinc-500">
        {itens.length} candidatura{itens.length === 1 ? "" : "s"}
      </p>

      {loading ? (
        <p className="text-sm text-zinc-400">Carregando…</p>
      ) : !itens.length ? (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
          Nenhuma candidatura
        </p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 lg:overflow-visible">
          {statusLista.map((status) => (
            <ColunaStatus
              key={status.id}
              status={status}
              itens={porStatus[status.id] ?? []}
              statusLista={statusLista}
              onStatus={mudarStatus}
              onRemover={remover}
              busyId={busyId}
            />
          ))}
        </div>
      )}

      {message ? (
        <p className="text-center text-xs font-medium text-red-600" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
