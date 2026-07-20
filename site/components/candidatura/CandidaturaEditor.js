"use client";

import { useRef, useState } from "react";
import {
  FormField,
  inputClass,
  selectClass,
} from "@/components/profile/FormField";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { DataList, DataRow } from "@/components/profile/ViewData";
import {
  CAMPOS_CANDIDATURA,
  displayCandidaturaValue,
  OPCOES_NIVEL,
  OPCOES_SIM_NAO,
} from "@/lib/candidaturaCampos";

function CampoEdit({ campo, value, onChange }) {
  if (campo.type === "money") {
    return (
      <FormField label={campo.label} hint="Valor em reais por mês">
        <input
          type="number"
          min={0}
          step={50}
          className={inputClass}
          placeholder="1500"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </FormField>
    );
  }

  if (campo.type === "sim_nao") {
    return (
      <FormField label={campo.label}>
        <select
          className={selectClass}
          value={value ?? "Não"}
          onChange={(e) => onChange(e.target.value)}
        >
          {OPCOES_SIM_NAO.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FormField>
    );
  }

  if (campo.type === "nivel") {
    return (
      <FormField label={campo.label}>
        <select
          className={selectClass}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Selecione</option>
          {OPCOES_NIVEL.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FormField>
    );
  }

  return (
    <FormField label={campo.label} full>
      <input
        className={inputClass}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </FormField>
  );
}

export default function CandidaturaEditor({ initial }) {
  const [candidatura, setCandidatura] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const snapshotRef = useRef(null);

  function update(key, value) {
    setCandidatura((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit() {
    snapshotRef.current = { ...candidatura };
    setEditing(true);
    setMessage("");
  }

  function cancelEdit() {
    if (snapshotRef.current) setCandidatura(snapshotRef.current);
    snapshotRef.current = null;
    setEditing(false);
  }

  async function saveEdit() {
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        ...candidatura,
        pretensao_salarial:
          candidatura.pretensao_salarial === "" ||
          candidatura.pretensao_salarial === null
            ? ""
            : Number(candidatura.pretensao_salarial),
      };

      const res = await fetch("/api/candidatura", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidatura: payload }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || data.error);

      setCandidatura(data.candidatura);
      snapshotRef.current = null;
      setEditing(false);
      setMessage("Salvo.");
    } catch (err) {
      setMessage(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {message ? (
        <p
          className={`mb-2 text-right text-xs font-medium ${message.includes("Salvo") || message.includes("salvo") ? "text-emerald-700" : "text-red-600"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <ProfileSection
        title="Candidatura"
        isEditing={editing}
        saving={saving}
        onEdit={startEdit}
        onCancel={cancelEdit}
        onSave={saveEdit}
        view={
          <DataList>
            {CAMPOS_CANDIDATURA.map((campo) => (
              <DataRow key={campo.key} label={campo.label}>
                {displayCandidaturaValue(campo, candidatura[campo.key])}
              </DataRow>
            ))}
          </DataList>
        }
        edit={
          <div className="grid gap-2.5 sm:grid-cols-2">
            {CAMPOS_CANDIDATURA.map((campo) => (
              <CampoEdit
                key={campo.key}
                campo={campo}
                value={candidatura[campo.key]}
                onChange={(v) => update(campo.key, v)}
              />
            ))}
          </div>
        }
      />
    </>
  );
}
