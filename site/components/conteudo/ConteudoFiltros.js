"use client";

import Link from "next/link";
import { ESCOPO_TUDO } from "@/lib/conteudoFiltro";

const TIPOS = [
  { id: "experiencias", label: "Experiência" },
  { id: "projetos", label: "Projetos" },
  { id: "cursos", label: "Cursos" },
  { id: "ferramentas", label: "Ferramentas" },
];

export { TIPOS as CONTEUDO_TIPOS };

export function ConteudoFiltros({
  escopo,
  onEscopoChange,
  tipo,
  onTipoChange,
  todosSegmentos = [],
  contagemPorTipo = {},
}) {
  return (
    <div className="mb-4 space-y-3">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          O que você já fez
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onEscopoChange(ESCOPO_TUDO)}
            className={
              escopo === ESCOPO_TUDO
                ? "rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white"
                : "rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
            }
          >
            Tudo
          </button>
          {todosSegmentos.map((seg) => (
            <button
              key={seg.slug}
              type="button"
              onClick={() => onEscopoChange(seg.slug)}
              className={
                escopo === seg.slug
                  ? "rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white"
                  : "rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
              }
            >
              {seg.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-zinc-500">
          {escopo === ESCOPO_TUDO
            ? "Inventário do que você já fez — cadastro e edição. Não gera PDF aqui."
            : (
              <>
                Só o que você marcou para{" "}
                {todosSegmentos.find((s) => s.slug === escopo)?.label ?? escopo}. Para montar o PDF do CV
                desta área, use{" "}
                <Link href="/curriculo" className="font-medium text-emerald-700 hover:underline">
                  Currículo
                </Link>
                .
              </>
            )}
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-t border-zinc-100 pt-3">
        {TIPOS.map((t) => {
          const n = contagemPorTipo[t.id];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onTipoChange(t.id)}
              className={
                tipo === t.id
                  ? "rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white"
                  : "rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              }
            >
              {t.label}
              {typeof n === "number" ? ` (${n})` : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
