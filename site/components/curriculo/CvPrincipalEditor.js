"use client";

import { useRef, useState } from "react";
import { FormField, textareaClass } from "@/components/profile/FormField";
import { ProfileSection } from "@/components/profile/ProfileSection";

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

export default function CvPrincipalEditor({ initialContent, initialSections }) {
  const [content, setContent] = useState(initialContent);
  const [sections, setSections] = useState(initialSections);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const snapshotRef = useRef(null);

  function startEdit() {
    snapshotRef.current = { content, sections };
    setEditing(true);
    setMessage("");
  }

  function cancelEdit() {
    if (snapshotRef.current) {
      setContent(snapshotRef.current.content);
      setSections(snapshotRef.current.sections);
    }
    snapshotRef.current = null;
    setEditing(false);
  }

  async function saveEdit() {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/curriculo/base", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || data.error);

      setContent(data.content);
      setSections(data.sections);
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
        title="Currículo principal"
        isEditing={editing}
        saving={saving}
        onEdit={startEdit}
        onCancel={cancelEdit}
        onSave={saveEdit}
        view={
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">
              Arquivo:{" "}
              <code className="rounded bg-zinc-100 px-1">dados/cv-base.md</code>
            </p>
            {sections.length ? (
              sections.map((section) => (
                <CvSection
                  key={section.title}
                  title={section.title}
                  body={section.body}
                />
              ))
            ) : (
              <p className="text-sm italic text-zinc-400">Vazio</p>
            )}
          </div>
        }
        edit={
          <FormField label="Conteúdo (Markdown)" full>
            <textarea
              className={`${textareaClass} min-h-[28rem] font-mono text-[13px]`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </FormField>
        }
      />
    </>
  );
}
