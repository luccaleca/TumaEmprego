"use client";

import { useRef, useState } from "react";
import {
  FormField,
  selectClass,
  textareaClass,
} from "@/components/profile/FormField";
import { FormSubsection } from "@/components/profile/FormSubsection";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { DataList, DataRow, DataText } from "@/components/profile/ViewData";
import { CAMPOS_NIVEL, OPCOES_NIVEL } from "@/lib/tecnologiasCampos";

function NivelSelect({ label, value, onChange }) {
  return (
    <FormField label={label}>
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

export default function TecnologiasEditor({ initial }) {
  const [tecnologias, setTecnologias] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const snapshotRef = useRef(null);

  function update(key, value) {
    setTecnologias((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit() {
    snapshotRef.current = { ...tecnologias };
    setEditing(true);
    setMessage("");
  }

  function cancelEdit() {
    if (snapshotRef.current) setTecnologias(snapshotRef.current);
    snapshotRef.current = null;
    setEditing(false);
  }

  async function saveEdit() {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/tecnologias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tecnologias }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || data.error);

      setTecnologias(data.tecnologias);
      snapshotRef.current = null;
      setEditing(false);
      setMessage("Alterações salvas.");
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
          className={`mb-2 text-right text-xs font-medium ${message.includes("salvas") ? "text-emerald-700" : "text-red-600"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <ProfileSection
        title="Tecnologias"
        isEditing={editing}
        saving={saving}
        onEdit={startEdit}
        onCancel={cancelEdit}
        onSave={saveEdit}
        view={
          <div className="space-y-5">
            <FormSubsection title="Nível">
              <DataList>
                {CAMPOS_NIVEL.map((campo) => (
                  <DataRow key={campo.key} label={campo.label}>
                    {tecnologias[campo.key]}
                  </DataRow>
                ))}
              </DataList>
            </FormSubsection>

            <FormSubsection title="Outras">
              <DataText>{tecnologias.outras}</DataText>
            </FormSubsection>
          </div>
        }
        edit={
          <div className="space-y-5">
            <FormSubsection title="Nível">
              <div className="grid gap-2.5 sm:grid-cols-2">
                {CAMPOS_NIVEL.map((campo) => (
                  <NivelSelect
                    key={campo.key}
                    label={campo.label}
                    value={tecnologias[campo.key]}
                    onChange={(v) => update(campo.key, v)}
                  />
                ))}
              </div>
            </FormSubsection>

            <FormSubsection title="Outras">
              <FormField label="Ferramentas" full>
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={tecnologias.outras ?? ""}
                  onChange={(e) => update("outras", e.target.value)}
                />
              </FormField>
            </FormSubsection>
          </div>
        }
      />
    </>
  );
}
