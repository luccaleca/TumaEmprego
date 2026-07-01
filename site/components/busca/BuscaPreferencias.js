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
import { contarAlvosExpandidos } from "@/lib/preferenciasBusca";
import { LABEL_SENIORIDADE, OPCOES_SENIORIDADE } from "@/lib/senioridadeOpcoes";

export default function BuscaPreferencias({
  preferencias,
  onChange,
  totalCargos,
}) {
  const totalAlvos = contarAlvosExpandidos(totalCargos, preferencias.senioridades);

  function update(key, value) {
    onChange({ ...preferencias, [key]: value });
  }

  return (
    <section className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900">Preferências</h2>
        <p className="text-xs text-zinc-500">
          <span className="font-medium text-zinc-700">{totalAlvos}</span>{" "}
          {totalAlvos === 1 ? "alvo" : "alvos"}
        </p>
      </div>

      <div className="space-y-4">
        <CheckboxChipGroup
          label="Senioridades"
          options={OPCOES_SENIORIDADE}
          labels={LABEL_SENIORIDADE}
          value={preferencias.senioridades}
          onChange={(v) => update("senioridades", v)}
        />
        <CheckboxChipGroup
          label="Modalidade de trabalho"
          options={OPCOES_MODALIDADE}
          labels={LABEL_MODALIDADE}
          value={preferencias.modalidades_trabalho}
          onChange={(v) => update("modalidades_trabalho", v)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
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
          <FormField label="Nota mínima (aderência)">
            <input
              type="number"
              min={1}
              max={5}
              step={0.5}
              className={inputClass}
              value={preferencias.nota_minima ?? 4}
              onChange={(e) => update("nota_minima", e.target.value)}
            />
          </FormField>
        </div>
      </div>
    </section>
  );
}
