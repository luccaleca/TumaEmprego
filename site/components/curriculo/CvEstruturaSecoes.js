"use client";

import { useState } from "react";

export const ORDEM_SECOES = [
  "Resumo",
  "Competências",
  "Experiência",
  "Projetos",
  "Formação",
  "Certificações",
];

function resumoLinha(body) {
  const linha = String(body ?? "")
    .split("\n")
    .map((l) => l.trim())
    .find(Boolean);
  if (!linha) return "—";
  return linha.length > 56 ? `${linha.slice(0, 56)}…` : linha;
}

function ChipBotao({ aberto, indice, titulo, hint, onClick, compact }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={aberto}
      className={[
        "flex w-full items-center gap-2 rounded-lg border text-left transition",
        compact ? "px-2 py-1.5" : "px-2.5 py-2",
        aberto
          ? "border-emerald-300 bg-emerald-50/80 ring-1 ring-emerald-200"
          : "border-zinc-200/90 bg-white hover:border-emerald-200 hover:bg-zinc-50/80",
      ].join(" ")}
    >
      <span
        className={[
          "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
          compact ? "h-5 w-5 text-[9px]" : "h-6 w-6 text-[10px]",
          indice === "·" ? "border border-dashed border-zinc-300 bg-zinc-100 text-zinc-400" : "bg-emerald-600",
        ].join(" ")}
      >
        {indice}
      </span>
      <span className="min-w-0 flex-1">
        <span className={["block font-semibold text-zinc-900", compact ? "text-[10px]" : "text-xs"].join(" ")}>
          {titulo}
        </span>
        {!aberto ? (
          <span
            className={["mt-0.5 block truncate font-mono text-zinc-400", compact ? "text-[9px]" : "text-[10px]"].join(
              " ",
            )}
          >
            {hint}
          </span>
        ) : null}
      </span>
      <span className={["shrink-0 text-zinc-400", compact ? "text-[10px]" : "text-xs"].join(" ")} aria-hidden>
        {aberto ? "▴" : "▾"}
      </span>
    </button>
  );
}

export function CvEstruturaSecaoChip({
  indice,
  titulo,
  body,
  compact = false,
  defaultOpen = false,
  aberto: abertoControlado,
  onToggle,
}) {
  const [abertoLocal, setAbertoLocal] = useState(defaultOpen);
  const aberto = abertoControlado ?? abertoLocal;
  const hint = titulo === "Cabeçalho" ? "# Nome · contato · links" : resumoLinha(body);

  function toggle() {
    if (onToggle) onToggle();
    else setAbertoLocal((v) => !v);
  }

  return (
    <div className="space-y-1">
      <ChipBotao
        aberto={aberto}
        indice={indice}
        titulo={titulo}
        hint={hint}
        onClick={toggle}
        compact={compact}
      />
      {aberto ? (
        <div
          className={[
            "overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50/90",
            compact ? "px-2 py-1.5" : "px-2.5 py-2",
          ].join(" ")}
        >
          <pre
            className={[
              "max-h-40 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed text-zinc-600",
              compact ? "text-[9px]" : "text-[10px]",
            ].join(" ")}
          >
            {body?.trim() ? body : "—"}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

export function CvEstruturaLista({ preamble = "", sections = [], compact = false }) {
  const porTitulo = Object.fromEntries((sections ?? []).map((s) => [s.title, s.body]));
  const ordenadas = ORDEM_SECOES.filter((t) => porTitulo[t] !== undefined).map((titulo) => ({
    titulo,
    body: porTitulo[titulo],
  }));

  const [abertoId, setAbertoId] = useState(null);

  function toggle(id) {
    setAbertoId((atual) => (atual === id ? null : id));
  }

  return (
    <div className={compact ? "grid grid-cols-1 gap-1.5 sm:grid-cols-2" : "space-y-1.5"}>
      <CvEstruturaSecaoChip
        indice="·"
        titulo="Cabeçalho"
        body={preamble}
        compact={compact}
        aberto={abertoId === "cabecalho"}
        onToggle={() => toggle("cabecalho")}
      />
      {ordenadas.map((sec, i) => (
        <CvEstruturaSecaoChip
          key={sec.titulo}
          indice={i + 1}
          titulo={sec.titulo}
          body={sec.body}
          compact={compact}
          aberto={abertoId === sec.titulo}
          onToggle={() => toggle(sec.titulo)}
        />
      ))}
    </div>
  );
}
