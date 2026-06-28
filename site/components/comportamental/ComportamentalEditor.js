"use client";

import { useRef, useState } from "react";
import {
  FormField,
  inputClass,
  textareaClass,
} from "@/components/profile/FormField";
import { FormSubsection } from "@/components/profile/FormSubsection";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { DataList, DataRow, DataText } from "@/components/profile/ViewData";
import {
  formatHistoriaTitle,
  RESPOSTAS_CURTAS,
  STAR_FIELDS,
  stringToTags,
  tagsToString,
} from "@/lib/comportamental";

function TagList({ tags }) {
  if (!tags?.length) {
    return <span className="text-sm italic text-zinc-400">Não informado</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function HistoriaView({ historia }) {
  return (
    <details className="group overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-50/40">
      <summary className="cursor-pointer list-none px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium leading-snug text-zinc-800">
            {formatHistoriaTitle(historia)}
          </p>
          <span
            aria-hidden
            className="mt-0.5 shrink-0 text-[10px] text-zinc-400 transition group-open:rotate-180"
          >
            ▼
          </span>
        </div>
        <p className="mt-1 font-mono text-[10px] text-zinc-400">{historia.id}</p>
      </summary>

      <div className="space-y-3 border-t border-zinc-200/80 px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Tags
          </p>
          <div className="mt-1.5">
            <TagList tags={historia.tags} />
          </div>
        </div>

        {STAR_FIELDS.map((field) => (
          <div key={field.key}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              {field.label}
            </p>
            <div className="mt-1">
              <DataText>{historia[field.key]?.trim?.() || historia[field.key]}</DataText>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function HistoriaEdit({ historia, index, onChange, onTagsChange }) {
  return (
    <details
      className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
      open={index === 0}
    >
      <summary className="cursor-pointer list-none border-b border-zinc-100 bg-zinc-50/80 px-3 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-medium text-zinc-800">
          {formatHistoriaTitle(historia)}
        </span>
      </summary>

      <div className="space-y-2.5 p-3">
        <FormField label="ID" hint="Não altere sem necessidade">
          <input className={`${inputClass} bg-zinc-50`} readOnly value={historia.id ?? ""} />
        </FormField>
        <FormField label="Pergunta exemplo" full>
          <input
            className={inputClass}
            value={historia.pergunta_exemplo ?? ""}
            onChange={(e) => onChange(index, "pergunta_exemplo", e.target.value)}
          />
        </FormField>
        <FormField label="Tags" hint="Separadas por vírgula" full>
          <input
            className={inputClass}
            value={tagsToString(historia.tags)}
            onChange={(e) => onTagsChange(index, e.target.value)}
          />
        </FormField>
        {STAR_FIELDS.map((field) => (
          <FormField key={field.key} label={field.label} full>
            <textarea
              className={textareaClass}
              rows={3}
              value={historia[field.key] ?? ""}
              onChange={(e) => onChange(index, field.key, e.target.value)}
            />
          </FormField>
        ))}
      </div>
    </details>
  );
}

export default function ComportamentalEditor({ initial }) {
  const [data, setData] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const snapshotRef = useRef(null);

  const historias = data.historias ?? [];
  const respostasCurtas = data.respostas_curtas ?? {};

  function startEdit() {
    snapshotRef.current = structuredClone(data);
    setEditing(true);
    setMessage("");
  }

  function cancelEdit() {
    if (snapshotRef.current) setData(snapshotRef.current);
    snapshotRef.current = null;
    setEditing(false);
  }

  function updateRespostaCurta(key, value) {
    setData((prev) => ({
      ...prev,
      respostas_curtas: { ...prev.respostas_curtas, [key]: value },
    }));
  }

  function updateHistoria(index, field, value) {
    setData((prev) => ({
      ...prev,
      historias: prev.historias.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function updateTags(index, value) {
    updateHistoria(index, "tags", stringToTags(value));
  }

  async function saveEdit() {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/comportamental", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comportamental: data }),
      });
      const payload = await res.json();

      if (!res.ok) throw new Error(payload.detail || payload.error);

      setData(payload.comportamental);
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
        title="Comportamental"
        isEditing={editing}
        saving={saving}
        onEdit={startEdit}
        onCancel={cancelEdit}
        onSave={saveEdit}
        view={
          <div className="space-y-5">
            <FormSubsection title="Respostas curtas">
              <DataList>
                {RESPOSTAS_CURTAS.map((item) => (
                  <DataRow key={item.key} label={item.label}>
                    <DataText>{respostasCurtas[item.key]}</DataText>
                  </DataRow>
                ))}
              </DataList>
            </FormSubsection>

            <FormSubsection title={`Histórias (${historias.length})`}>
              <div className="space-y-2">
                {historias.map((historia) => (
                  <HistoriaView key={historia.id} historia={historia} />
                ))}
              </div>
            </FormSubsection>
          </div>
        }
        edit={
          <div className="space-y-5">
            <FormSubsection title="Respostas curtas">
              <div className="space-y-2.5">
                {RESPOSTAS_CURTAS.map((item) => (
                  <FormField key={item.key} label={item.label} full>
                    <textarea
                      className={textareaClass}
                      rows={3}
                      value={respostasCurtas[item.key] ?? ""}
                      onChange={(e) => updateRespostaCurta(item.key, e.target.value)}
                    />
                  </FormField>
                ))}
              </div>
            </FormSubsection>

            <FormSubsection title={`Histórias (${historias.length})`}>
              <div className="space-y-2">
                {historias.map((historia, index) => (
                  <HistoriaEdit
                    key={historia.id}
                    historia={historia}
                    index={index}
                    onChange={updateHistoria}
                    onTagsChange={updateTags}
                  />
                ))}
              </div>
            </FormSubsection>
          </div>
        }
      />
    </>
  );
}
