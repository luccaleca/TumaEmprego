"use client";

import { useRef } from "react";
import { inputClass } from "@/components/profile/FormField";

export default function BuscaBuscador({
  value,
  onChange,
  resultados,
  buscando,
  onIrPara,
  onToggleTitulo,
}) {
  const inputRef = useRef(null);

  function irPara(id) {
    onIrPara?.(id);
    const areaSlug = String(id).split("/")[0];
    const el = document.getElementById(`busca-area-${areaSlug}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.classList.add("ring-2", "ring-amber-400");
    window.setTimeout(() => {
      el?.classList.remove("ring-2", "ring-amber-400");
    }, 1600);
  }

  return (
    <section className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm sm:p-5">
      <label htmlFor="busca-vaga-input" className="mb-2 block text-sm font-semibold text-zinc-900">
        Filtrar cargos
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id="busca-vaga-input"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ex.: analista de dados, full stack, cientista de dados…"
          className={`${inputClass} pr-9`}
          autoComplete="off"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 text-sm text-zinc-400 hover:text-zinc-600"
            aria-label="Limpar filtro"
          >
            ×
          </button>
        ) : null}
      </div>

      {buscando ? (
        <div className="mt-3">
          {resultados.length ? (
            <>
              <p className="mb-2 text-xs text-zinc-500">
                {resultados.length} {resultados.length === 1 ? "resultado" : "resultados"}
              </p>
              <ul className="max-h-56 space-y-1 overflow-y-auto" role="listbox">
                {resultados.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={item.ativo}
                      onClick={() => {
                        onToggleTitulo?.(item.id);
                        irPara(item.id);
                      }}
                      className={[
                        "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition",
                        item.ativo
                          ? "border-emerald-200 bg-emerald-50/80 hover:bg-emerald-50"
                          : "border-zinc-100 bg-zinc-50/80 hover:border-emerald-200 hover:bg-emerald-50/50",
                      ].join(" ")}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-zinc-900">
                          {item.nome}
                        </span>
                        <span className="block truncate text-xs text-zinc-500">{item.caminho}</span>
                      </span>
                      <span
                        className={[
                          "shrink-0 text-[10px] font-medium uppercase",
                          item.ativo ? "text-emerald-700" : "text-zinc-400",
                        ].join(" ")}
                      >
                        {item.ativo ? "selecionado" : "adicionar"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-zinc-500">Nenhum cargo no catálogo com esse termo.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
