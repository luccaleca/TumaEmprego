"use client";

import { useRef, useState } from "react";
import { FormField, inputClass, textareaClass } from "@/components/profile/FormField";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { DataTags } from "@/components/profile/ViewData";
import { SegmentChips } from "@/components/conteudo/SegmentChips";
import { slugParaLabel } from "@/lib/conteudoConstants";
import {
  escopoEhTudo,
  filtrarItensPorEscopo,
} from "@/lib/conteudoFiltro";
import { montarPreviewExperiencia, montarPreviewExperienciaTudo } from "@/lib/conteudoPreview";

function emptyExperiencia(defaultSegmentos) {
  const seg = defaultSegmentos?.[0] ?? "dados-bi-analytics";
  return {
    id: `exp-${Date.now()}`,
    empresa: "",
    periodo: "",
    local: "",
    segmentos: [seg],
    titulo_por_segmento: {},
    nota_por_segmento: {},
    bullets: [{ texto: "", segmentos: [seg] }],
  };
}

function ExperienciasView({ items, escopo, todosSegmentos }) {
  const filtrados = filtrarItensPorEscopo(items, escopo);

  if (!filtrados.length) {
    return (
      <p className="text-sm italic text-zinc-400">
        {escopoEhTudo(escopo) ? "Nenhuma experiência cadastrada." : "Nenhuma experiência nesta área."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {filtrados.map((exp, i) => {
        if (escopoEhTudo(escopo)) {
          const preview = montarPreviewExperienciaTudo(exp);
          if (!preview) return null;

          return (
            <details
              key={exp.id}
              className="overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-50/40"
              open={i === 0}
            >
              <summary className="cursor-pointer list-none px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
                <p className="text-sm font-medium text-zinc-800">{preview.titulo}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {[preview.periodo, preview.local].filter(Boolean).join(" · ")}
                </p>
              </summary>
              <div className="space-y-2 border-t border-zinc-200/80 px-4 py-3">
                {preview.bullets.length ? (
                  <ul className="space-y-2 text-sm text-zinc-700">
                    {preview.bullets.map((b, bi) => (
                      <li key={bi} className="flex flex-col gap-0.5">
                        <span>{b.text}</span>
                        <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                          {slugParaLabel(b.slug, todosSegmentos)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm italic text-zinc-400">Sem entregas cadastradas.</p>
                )}
                <div className="pt-1">
                  <DataTags
                    items={preview.segmentos.map((s) => slugParaLabel(s, todosSegmentos))}
                    tone="neutral"
                  />
                </div>
              </div>
            </details>
          );
        }

        const preview = montarPreviewExperiencia(exp, escopo);
        if (!preview) return null;

        return (
          <details
            key={exp.id}
            className="overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-50/40"
            open={i === 0}
          >
            <summary className="cursor-pointer list-none px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
              <p className="text-sm font-medium text-zinc-800">{preview.titulo}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {[preview.periodo, preview.local].filter(Boolean).join(" · ")}
              </p>
            </summary>
            <div className="space-y-2 border-t border-zinc-200/80 px-4 py-3">
              {preview.bullets.length ? (
                <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700">
                  {preview.bullets.map((b, bi) => (
                    <li key={bi}>{b}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic text-zinc-400">Sem entregas nesta área.</p>
              )}
              {preview.nota ? <p className="text-xs italic text-zinc-500">{preview.nota}</p> : null}
              <div className="pt-1">
                <DataTags
                  items={(exp.segmentos ?? []).map((s) => slugParaLabel(s, todosSegmentos))}
                  tone="neutral"
                />
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}

function ExperienciasEdit({ banco, setBanco, updateExperiencia, todosSegmentos }) {
  const slugs = todosSegmentos.map((s) => s.slug);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          className="text-xs font-medium text-emerald-700 hover:underline"
          onClick={() =>
            setBanco((p) => ({
              ...p,
              experiencias: [...(p.experiencias ?? []), emptyExperiencia(slugs)],
            }))
          }
        >
          + Adicionar experiência
        </button>
      </div>

      {(banco.experiencias ?? []).map((exp, i) => (
        <details key={exp.id} className="rounded-lg border border-zinc-200 bg-white" open={i === 0}>
          <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium text-zinc-800">
            {exp.empresa || "Nova experiência"}
          </summary>
          <div className="space-y-3 border-t border-zinc-100 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Dados gerais
            </p>
            <FormField label="Empresa">
              <input
                className={inputClass}
                value={exp.empresa ?? ""}
                onChange={(e) => updateExperiencia(i, { empresa: e.target.value })}
              />
            </FormField>
            <div className="grid gap-2 sm:grid-cols-2">
              <FormField label="Período">
                <input
                  className={inputClass}
                  value={exp.periodo ?? ""}
                  onChange={(e) => updateExperiencia(i, { periodo: e.target.value })}
                />
              </FormField>
              <FormField label="Local">
                <input
                  className={inputClass}
                  value={exp.local ?? ""}
                  onChange={(e) => updateExperiencia(i, { local: e.target.value })}
                />
              </FormField>
            </div>

            <SegmentChips
              label="Usar esta experiência nas áreas"
              value={exp.segmentos}
              onChange={(segmentos) => updateExperiencia(i, { segmentos })}
              segmentos={todosSegmentos}
            />

            {(exp.segmentos ?? []).length ? (
              <div className="space-y-4">
                {(exp.segmentos ?? []).map((slug) => (
                  <div key={slug} className="space-y-2 rounded-lg border border-zinc-100 bg-zinc-50/40 p-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      {slugParaLabel(slug, todosSegmentos)}
                    </p>
                    <FormField label="Cargo / título" full>
                      <input
                        className={inputClass}
                        placeholder="Ex.: Estagiário em Análise de Dados"
                        value={exp.titulo_por_segmento?.[slug] ?? ""}
                        onChange={(e) =>
                          updateExperiencia(i, {
                            titulo_por_segmento: {
                              ...exp.titulo_por_segmento,
                              [slug]: e.target.value,
                            },
                          })
                        }
                      />
                    </FormField>
                    <FormField label="Nota de contexto (opcional)" full>
                      <textarea
                        className={textareaClass}
                        rows={2}
                        placeholder="Ex.: foco em SQL e dashboards"
                        value={exp.nota_por_segmento?.[slug] ?? ""}
                        onChange={(e) =>
                          updateExperiencia(i, {
                            nota_por_segmento: {
                              ...exp.nota_por_segmento,
                              [slug]: e.target.value,
                            },
                          })
                        }
                      />
                    </FormField>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400">Marque ao menos uma área acima</p>
            )}

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Entregas (bullets)
              </p>
              {(exp.bullets ?? []).map((b, bi) => (
                <div key={bi} className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5">
                  <FormField label="O que você fez" full>
                    <textarea
                      className={textareaClass}
                      rows={2}
                      value={b.texto ?? ""}
                      onChange={(e) => {
                        const bullets = [...exp.bullets];
                        bullets[bi] = { ...bullets[bi], texto: e.target.value };
                        updateExperiencia(i, { bullets });
                      }}
                    />
                  </FormField>
                  <div className="mt-2">
                    <SegmentChips
                      label="Mostrar nas áreas"
                      value={b.segmentos}
                      onChange={(segmentos) => {
                        const bullets = [...exp.bullets];
                        bullets[bi] = { ...bullets[bi], segmentos };
                        updateExperiencia(i, { bullets });
                      }}
                      segmentos={todosSegmentos}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="text-xs text-emerald-700"
                onClick={() =>
                  updateExperiencia(i, {
                    bullets: [
                      ...(exp.bullets ?? []),
                      {
                        texto: "",
                        segmentos: exp.segmentos?.length ? [...exp.segmentos] : [slugs[0]].filter(Boolean),
                      },
                    ],
                  })
                }
              >
                + Entrega
              </button>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

export default function ExperienciasWorkspace({
  banco,
  setBanco,
  escopo,
  todosSegmentos = [],
  title = "Experiência",
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const snapshotRef = useRef(null);

  function updateExperiencia(index, patch) {
    setBanco((prev) => {
      const experiencias = [...(prev.experiencias ?? [])];
      experiencias[index] = { ...experiencias[index], ...patch };
      return { ...prev, experiencias };
    });
  }

  function startEdit() {
    snapshotRef.current = structuredClone(banco);
    setEditing(true);
    setMessage("");
  }

  function cancelEdit() {
    if (snapshotRef.current) setBanco(snapshotRef.current);
    snapshotRef.current = null;
    setEditing(false);
    setMessage("");
  }

  async function saveEdit() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/conteudo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banco }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error);
      setBanco(data.banco);
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
    <div className="space-y-4">
      {message ? (
        <p
          className={`text-right text-xs font-medium ${message.includes("Salvo") ? "text-emerald-700" : "text-red-600"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <ProfileSection
        title={title}
        isEditing={editing}
        saving={saving}
        onEdit={startEdit}
        onCancel={cancelEdit}
        onSave={saveEdit}
        view={
          <ExperienciasView
            items={banco.experiencias}
            escopo={escopo}
            todosSegmentos={todosSegmentos}
          />
        }
        edit={
          <ExperienciasEdit
            banco={banco}
            setBanco={setBanco}
            updateExperiencia={updateExperiencia}
            todosSegmentos={todosSegmentos}
          />
        }
      />
    </div>
  );
}
