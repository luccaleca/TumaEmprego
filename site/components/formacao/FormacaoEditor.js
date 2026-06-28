"use client";

import { useRef, useState } from "react";
import {
  FormField,
  inputClass,
  selectClass,
} from "@/components/profile/FormField";
import { FormSubsection } from "@/components/profile/FormSubsection";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { DataList, DataRow } from "@/components/profile/ViewData";
import { OPCOES_STATUS_CURSO, OPCOES_TURNO } from "@/lib/formacaoOpcoes";

function SelectField({ label, value, onChange, options, hint, full = false }) {
  return (
    <FormField label={label} hint={hint} full={full}>
      <select
        className={selectClass}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option || "__empty"} value={option}>
            {option || "Selecione"}
          </option>
        ))}
      </select>
    </FormField>
  );
}

function displaySemestre(semestre) {
  if (semestre === null || semestre === undefined || semestre === "") return null;
  return `${semestre}º semestre`;
}

export default function FormacaoEditor({ initial }) {
  const [formacao, setFormacao] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const snapshotRef = useRef(null);

  function update(key, value) {
    setFormacao((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit() {
    snapshotRef.current = { ...formacao };
    setEditing(true);
    setMessage("");
  }

  function cancelEdit() {
    if (snapshotRef.current) setFormacao(snapshotRef.current);
    snapshotRef.current = null;
    setEditing(false);
  }

  async function saveEdit() {
    setSaving(true);
    setMessage("");

    try {
      const semestreRaw = formacao.semestre;
      const semestre =
        semestreRaw === "" || semestreRaw === null || semestreRaw === undefined
          ? ""
          : Number(semestreRaw);

      const payload = {
        ...formacao,
        semestre: Number.isNaN(semestre) ? "" : semestre,
      };

      const res = await fetch("/api/formacao", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formacao: payload }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || data.error);

      setFormacao(data.formacao);
      snapshotRef.current = null;
      setEditing(false);
      setMessage("Alterações salvas.");
    } catch (err) {
      setMessage(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const campus =
    formacao.cidade_campus && formacao.estado_campus
      ? `${formacao.cidade_campus}, ${formacao.estado_campus}`
      : formacao.cidade_campus || formacao.estado_campus;

  return (
    <>
      {message ? (
        <p
          className={`mb-2 text-right text-xs font-medium ${message.includes("salvas") ? "text-emerald-700" : "text-red-600"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <ProfileSection
        title="Formação"
        isEditing={editing}
        saving={saving}
        onEdit={startEdit}
        onCancel={cancelEdit}
        onSave={saveEdit}
        view={
          <div className="space-y-5">
            <FormSubsection title="Curso">
              <DataList>
                <DataRow label="Instituição">{formacao.instituicao}</DataRow>
                <DataRow label="Curso">{formacao.curso}</DataRow>
                <DataRow label="Grau">{formacao.grau}</DataRow>
                <DataRow label="Semestre">
                  {displaySemestre(formacao.semestre)}
                </DataRow>
                <DataRow label="Início">{formacao.periodo_inicio}</DataRow>
                <DataRow label="Previsão de formatura">
                  {formacao.previsao_formatura}
                </DataRow>
                <DataRow label="Campus">{campus}</DataRow>
                <DataRow label="Status">{formacao.status}</DataRow>
                <DataRow label="Turno">{formacao.turno}</DataRow>
              </DataList>
            </FormSubsection>

            <FormSubsection title="Estágio">
              <DataList>
                <DataRow label="Horário disponível">
                  {formacao.horario_disponivel}
                </DataRow>
                <DataRow label="Carga horária semanal">
                  {formacao.carga_horaria_semanal}
                </DataRow>
                <DataRow label="Disponibilidade para início">
                  {formacao.disponibilidade_inicio}
                </DataRow>
              </DataList>
            </FormSubsection>
          </div>
        }
        edit={
          <div className="space-y-5">
            <FormSubsection title="Curso">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <FormField label="Instituição" full>
                  <input
                    className={inputClass}
                    value={formacao.instituicao ?? ""}
                    onChange={(e) => update("instituicao", e.target.value)}
                  />
                </FormField>
                <FormField label="Curso" full>
                  <input
                    className={inputClass}
                    value={formacao.curso ?? ""}
                    onChange={(e) => update("curso", e.target.value)}
                  />
                </FormField>
                <FormField label="Grau">
                  <input
                    className={inputClass}
                    placeholder="Bacharelado"
                    value={formacao.grau ?? ""}
                    onChange={(e) => update("grau", e.target.value)}
                  />
                </FormField>
                <FormField label="Semestre">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className={inputClass}
                    value={formacao.semestre ?? ""}
                    onChange={(e) => update("semestre", e.target.value)}
                  />
                </FormField>
                <FormField label="Início" hint="MM/AAAA">
                  <input
                    className={inputClass}
                    placeholder="08/2022"
                    value={formacao.periodo_inicio ?? ""}
                    onChange={(e) => update("periodo_inicio", e.target.value)}
                  />
                </FormField>
                <FormField label="Previsão de formatura" hint="MM/AAAA">
                  <input
                    className={inputClass}
                    placeholder="08/2027"
                    value={formacao.previsao_formatura ?? ""}
                    onChange={(e) =>
                      update("previsao_formatura", e.target.value)
                    }
                  />
                </FormField>
                <FormField label="Cidade do campus">
                  <input
                    className={inputClass}
                    value={formacao.cidade_campus ?? ""}
                    onChange={(e) => update("cidade_campus", e.target.value)}
                  />
                </FormField>
                <FormField label="UF do campus">
                  <input
                    className={inputClass}
                    placeholder="SP"
                    maxLength={2}
                    value={formacao.estado_campus ?? ""}
                    onChange={(e) =>
                      update("estado_campus", e.target.value.toUpperCase())
                    }
                  />
                </FormField>
                <SelectField
                  label="Status"
                  value={formacao.status}
                  onChange={(v) => update("status", v)}
                  options={OPCOES_STATUS_CURSO}
                />
                <SelectField
                  label="Turno"
                  value={formacao.turno}
                  onChange={(v) => update("turno", v)}
                  options={OPCOES_TURNO}
                />
              </div>
            </FormSubsection>

            <FormSubsection title="Estágio">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <FormField label="Horário disponível" full>
                  <input
                    className={inputClass}
                    placeholder="Ex.: Qualquer horário, exceto 19h–22h"
                    value={formacao.horario_disponivel ?? ""}
                    onChange={(e) =>
                      update("horario_disponivel", e.target.value)
                    }
                  />
                </FormField>
                <FormField label="Carga horária semanal" hint="Ex.: 30h">
                  <input
                    className={inputClass}
                    placeholder="30h"
                    value={formacao.carga_horaria_semanal ?? ""}
                    onChange={(e) =>
                      update("carga_horaria_semanal", e.target.value)
                    }
                  />
                </FormField>
                <FormField label="Disponibilidade para início" full>
                  <input
                    className={inputClass}
                    placeholder="Imediata"
                    value={formacao.disponibilidade_inicio ?? ""}
                    onChange={(e) =>
                      update("disponibilidade_inicio", e.target.value)
                    }
                  />
                </FormField>
              </div>
            </FormSubsection>
          </div>
        }
      />
    </>
  );
}
