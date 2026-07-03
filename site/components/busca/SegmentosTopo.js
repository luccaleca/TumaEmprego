"use client";

import CheckboxChipGroup from "@/components/profile/CheckboxChipGroup";
import { FormField, inputClass, selectClass } from "@/components/profile/FormField";
import {
  HINT_MODO,
  LABEL_MODO,
  LABEL_MODALIDADE,
  OPCOES_MODO,
  OPCOES_MODALIDADE,
} from "@/lib/buscaOpcoes";
import { LABEL_SENIORIDADE, OPCOES_SENIORIDADE } from "@/lib/senioridadeOpcoes";

export default function SegmentosTopo({
  preferencias,
  onChange,
  consulta,
  onConsultaChange,
  resultados,
  buscando,
  onToggleTitulo,
  onIrPara,
  totalAlvos,
}) {
  function update(key, value) {
    onChange({ ...preferencias, [key]: value });
  }

  function irPara(id) {
    onIrPara?.(id);
    const areaSlug = String(id).split("/")[0];
    document.getElementById(`busca-area-${areaSlug}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  return (
    <section className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900">Perfil de busca</h2>
        {totalAlvos > 0 ? (
          <p className="text-xs text-zinc-500">
            <span className="font-medium text-zinc-700">{totalAlvos}</span>{" "}
            {totalAlvos === 1 ? "alvo" : "alvos"}
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <CheckboxChipGroup
          label="Senioridade"
          options={OPCOES_SENIORIDADE}
          labels={LABEL_SENIORIDADE}
          value={preferencias.senioridades}
          onChange={(v) => update("senioridades", v)}
        />
        <CheckboxChipGroup
          label="Modalidade"
          options={OPCOES_MODALIDADE}
          labels={LABEL_MODALIDADE}
          value={preferencias.modalidades_trabalho}
          onChange={(v) => update("modalidades_trabalho", v)}
        />

        <div>
          <label htmlFor="busca-vaga-input" className="mb-2 block text-sm font-medium text-zinc-800">
            Filtrar cargos
          </label>
          <div className="relative">
            <input
              id="busca-vaga-input"
              type="search"
              value={consulta}
              onChange={(e) => onConsultaChange(e.target.value)}
              placeholder="Ex.: analista de dados, full stack…"
              className={`${inputClass} pr-9`}
              autoComplete="off"
            />
            {consulta ? (
              <button
                type="button"
                onClick={() => onConsultaChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 text-sm text-zinc-400 hover:text-zinc-600"
                aria-label="Limpar filtro"
              >
                ×
              </button>
            ) : null}
          </div>

          {buscando ? (
            <div className="mt-2">
              {resultados.length ? (
                <ul className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-zinc-100 bg-zinc-50/80 p-1" role="listbox">
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
                          "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left transition",
                          item.ativo
                            ? "bg-emerald-100/80 text-emerald-950"
                            : "hover:bg-white",
                        ].join(" ")}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{item.nome}</span>
                          <span className="block truncate text-xs text-zinc-500">{item.caminho}</span>
                        </span>
                        <span className="shrink-0 text-[10px] font-medium uppercase text-zinc-500">
                          {item.ativo ? "✓" : "+"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-zinc-500">Nenhum cargo com esse termo.</p>
              )}
            </div>
          ) : null}
        </div>

        <FormField
          label="Abrangência"
          hint={HINT_MODO[preferencias.modo_busca] ?? ""}
        >
          <select
            className={selectClass}
            value={preferencias.modo_busca ?? "focado"}
            onChange={(e) => update("modo_busca", e.target.value)}
          >
            {OPCOES_MODO.map((option) => (
              <option key={option} value={option}>
                {LABEL_MODO[option]}
              </option>
            ))}
          </select>
        </FormField>
      </div>    </section>
  );
}
