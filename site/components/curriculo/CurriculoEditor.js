"use client";

import { useRef, useState } from "react";
import {
  FormField,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/profile/FormField";
import { FormSubsection } from "@/components/profile/FormSubsection";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { DataList, DataRow, DataText } from "@/components/profile/ViewData";
import {
  CAMPOS_VAGA,
  labelEnfase,
  labelStatus,
  OPCOES_ENFASE,
  OPCOES_STATUS,
} from "@/lib/curriculoCampos";

function CvSection({ title, body }) {
  return (
    <details className="group overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-50/40">
      <summary className="cursor-pointer list-none px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-zinc-800">{title}</p>
          <span
            aria-hidden
            className="shrink-0 text-[10px] text-zinc-400 transition group-open:rotate-180"
          >
            ▼
          </span>
        </div>
      </summary>
      <div className="border-t border-zinc-200/80 px-4 py-3">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-700">
          {body}
        </pre>
      </div>
    </details>
  );
}

function CampoVaga({ campo, value, onChange }) {
  if (campo.type === "status") {
    return (
      <FormField label={campo.label}>
        <select
          className={selectClass}
          value={value ?? "inbox"}
          onChange={(e) => onChange(e.target.value)}
        >
          {OPCOES_STATUS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
    );
  }

  if (campo.type === "enfase") {
    return (
      <FormField label={campo.label}>
        <select
          className={selectClass}
          value={value ?? "dados"}
          onChange={(e) => onChange(e.target.value)}
        >
          {OPCOES_ENFASE.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
    );
  }

  if (campo.type === "nota") {
    return (
      <FormField label={campo.label} hint="1 a 5 — preenchido pelo Agent">
        <input
          type="number"
          min={1}
          max={5}
          step={0.1}
          className={inputClass}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </FormField>
    );
  }

  if (campo.type === "textarea") {
    return (
      <FormField label={campo.label} full={campo.full}>
        <textarea
          className={textareaClass}
          rows={4}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </FormField>
    );
  }

  return (
    <FormField label={campo.label} full={campo.full}>
      <input
        className={inputClass}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </FormField>
  );
}

function displayVagaValue(campo, value) {
  if (campo.type === "status") return labelStatus(value);
  if (campo.type === "enfase") return labelEnfase(value);
  if (campo.type === "nota" && value !== "" && value != null) return String(value);
  if (campo.type === "textarea") return <DataText>{value}</DataText>;
  if (campo.key === "url" && value) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-sm font-medium text-emerald-700 hover:underline"
      >
        {value}
      </a>
    );
  }
  return value;
}

export default function CurriculoEditor({ base, initialAtivo }) {
  const [ativo, setAtivo] = useState(initialAtivo);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const snapshotRef = useRef(null);

  function update(key, value) {
    setAtivo((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit() {
    snapshotRef.current = { ...ativo };
    setEditing(true);
    setMessage("");
  }

  function cancelEdit() {
    if (snapshotRef.current) setAtivo(snapshotRef.current);
    snapshotRef.current = null;
    setEditing(false);
  }

  async function saveEdit() {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/curriculo/ativo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || data.error);

      setAtivo(data.ativo);
      snapshotRef.current = null;
      setEditing(false);
      setMessage("Alterações salvas.");
    } catch (err) {
      setMessage(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const temVaga = Boolean(ativo.empresa || ativo.titulo);

  return (
    <div className="space-y-4">
      <ProfileSection
        title="CV base"
        readOnly
        isEditing={false}
        saving={false}
        onEdit={() => {}}
        onCancel={() => {}}
        onSave={() => {}}
        view={
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">
              Fonte: <code className="rounded bg-zinc-100 px-1">dados/cv-base.md</code>
              . O Agent adapta por vaga sem inventar fatos.
            </p>
            {base.map((section) => (
              <CvSection key={section.title} title={section.title} body={section.body} />
            ))}
          </div>
        }
      />

      {message ? (
        <p
          className={`text-right text-xs font-medium ${message.includes("salvas") ? "text-emerald-700" : "text-red-600"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <ProfileSection
        title="Vaga atual"
        isEditing={editing}
        saving={saving}
        onEdit={startEdit}
        onCancel={cancelEdit}
        onSave={saveEdit}
        view={
          temVaga ? (
            <DataList>
              {CAMPOS_VAGA.map((campo) => (
                <DataRow key={campo.key} label={campo.label}>
                  {displayVagaValue(campo, ativo[campo.key])}
                </DataRow>
              ))}
            </DataList>
          ) : (
            <p className="text-sm text-zinc-500">
              Nenhuma vaga em andamento. Clique em Editar para colar uma vaga.
            </p>
          )
        }
        edit={
          <div className="grid gap-2.5 sm:grid-cols-2">
            {CAMPOS_VAGA.map((campo) => (
              <CampoVaga
                key={campo.key}
                campo={campo}
                value={ativo[campo.key]}
                onChange={(v) => update(campo.key, v)}
              />
            ))}
          </div>
        }
      />
    </div>
  );
}
