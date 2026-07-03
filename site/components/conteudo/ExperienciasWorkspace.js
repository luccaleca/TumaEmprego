"use client";

import { useEffect, useRef, useState } from "react";
import { FormField, inputClass, textareaClass } from "@/components/profile/FormField";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { DataTags, DataText } from "@/components/profile/ViewData";
import CvExperienciaPreview from "@/components/conteudo/CvExperienciaPreview";
import { SegmentChips, SegmentPicker, SegmentTabs } from "@/components/conteudo/SegmentChips";
import { slugParaLabel } from "@/lib/conteudoConstants";
import { montarPreviewExperiencia } from "@/lib/conteudoPreview";

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

function ExperienciasView({ items, previewSlug, segmentosAtivos }) {
  if (!items?.length) {
    return <p className="text-sm italic text-zinc-400">Nenhuma experiência cadastrada.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((exp, i) => {
        const preview = montarPreviewExperiencia(exp, previewSlug);
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
                  items={(exp.segmentos ?? []).map((s) => slugParaLabel(s, segmentosAtivos))}
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

function ExperienciasEdit({ banco, setBanco, updateExperiencia, editSegment, segmentosAtivos }) {
  const slugs = segmentosAtivos.map((s) => s.slug);

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
              Dados reais (todas as versões)
            </p>
            <p className="text-[11px] text-zinc-500">
              Cada segmento destaca competências diferentes do mesmo emprego — reframe, não inventar.
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
              hint="só aparece no CV das áreas marcadas"
              value={exp.segmentos}
              onChange={(segmentos) => updateExperiencia(i, { segmentos })}
              segmentos={segmentosAtivos}
            />

            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Versão · {slugParaLabel(editSegment, segmentosAtivos)}
            </p>

            {(exp.segmentos ?? []).includes(editSegment) ? (
              <>
                <FormField label="Cargo / título nesta área" full>
                  <input
                    className={inputClass}
                    placeholder="Ex.: Estagiário em Análise de Dados"
                    value={exp.titulo_por_segmento?.[editSegment] ?? ""}
                    onChange={(e) =>
                      updateExperiencia(i, {
                        titulo_por_segmento: {
                          ...exp.titulo_por_segmento,
                          [editSegment]: e.target.value,
                        },
                      })
                    }
                  />
                </FormField>
                <FormField label="Nota de contexto (opcional)" full>
                  <textarea
                    className={textareaClass}
                    rows={2}
                    placeholder="Uma linha que reforça o foco desta área"
                    value={exp.nota_por_segmento?.[editSegment] ?? ""}
                    onChange={(e) =>
                      updateExperiencia(i, {
                        nota_por_segmento: {
                          ...exp.nota_por_segmento,
                          [editSegment]: e.target.value,
                        },
                      })
                    }
                  />
                </FormField>
              </>
            ) : (
              <p className="text-xs text-zinc-500">
                Marque a área &quot;{slugParaLabel(editSegment, segmentosAtivos)}&quot; acima para editar esta
                versão.
              </p>
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
                      segmentos={segmentosAtivos}
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
                      { texto: "", segmentos: exp.segmentos?.length ? [...exp.segmentos] : [editSegment] },
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

export default function ExperienciasWorkspace({ banco, setBanco, segmentosAtivos = [] }) {
  const slugs = segmentosAtivos.map((s) => s.slug);
  const [previewSlug, setPreviewSlug] = useState(slugs[0] ?? "");
  const [editSegment, setEditSegment] = useState(slugs[0] ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const snapshotRef = useRef(null);

  useEffect(() => {
    if (!slugs.length) return;
    if (!slugs.includes(previewSlug)) setPreviewSlug(slugs[0]);
    if (!slugs.includes(editSegment)) setEditSegment(slugs[0]);
  }, [slugs.join("|"), previewSlug, editSegment]);

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
      setMessage("Salvo. Gere de novo em Currículo ou Segmentos para aplicar.");
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

      <SegmentPicker
        value={previewSlug}
        onChange={setPreviewSlug}
        label="Prévia do CV para"
        segmentos={segmentosAtivos}
      />

      <CvExperienciaPreview experiencias={banco.experiencias} segmentoSlug={previewSlug} />

      {editing ? (
        <SegmentTabs
          value={editSegment}
          onChange={setEditSegment}
          segmentos={segmentosAtivos}
          prefix="Editar · "
        />
      ) : null}

      <ProfileSection
        title="Minhas experiências"
        description="Cadastre estágios e trabalhos. Cada área de vaga usa título e entregas diferentes."
        isEditing={editing}
        saving={saving}
        onEdit={startEdit}
        onCancel={cancelEdit}
        onSave={saveEdit}
        view={<ExperienciasView items={banco.experiencias} previewSlug={previewSlug} segmentosAtivos={segmentosAtivos} />}
        edit={
          <ExperienciasEdit
            banco={banco}
            setBanco={setBanco}
            updateExperiencia={updateExperiencia}
            editSegment={editSegment}
            segmentosAtivos={segmentosAtivos}
          />
        }
      />
    </div>
  );
}
