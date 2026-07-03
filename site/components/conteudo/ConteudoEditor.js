"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FormField,
  inputClass,
  textareaClass,
} from "@/components/profile/FormField";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { DataTags } from "@/components/profile/ViewData";
import ExperienciasWorkspace from "@/components/conteudo/ExperienciasWorkspace";
import {
  SegmentChips,
  SegmentEditTabs,
  SegmentTabs,
} from "@/components/conteudo/SegmentChips";
import { slugParaLabel } from "@/lib/conteudoConstants";

const TABS = [
  { id: "experiencias", label: "Experiência" },
  { id: "cursos", label: "Cursos" },
  { id: "projetos", label: "Projetos" },
  { id: "ferramentas", label: "Ferramentas" },
];

const CATEGORIAS_FERRAMENTA = [
  "Dados / back-end",
  "BI",
  "Banco de dados",
  "Dados",
  "Front-end",
  "Back-end",
  "IA",
  "Automação",
  "Marketing / analytics",
  "Marketing",
  "DevOps",
  "Ferramentas",
];

function emptyProjeto(defaultSegmentos) {
  const seg = defaultSegmentos?.[0] ?? "desenvolvimento";
  return {
    id: `proj-${Date.now()}`,
    nome: "",
    segmentos: [seg],
    ordem_por_segmento: {},
    subtitulo_por_segmento: {},
    stack_por_segmento: {},
    bullets_por_segmento: {},
  };
}

function emptyCurso(defaultSegmentos) {
  const seg = defaultSegmentos?.[0] ?? "desenvolvimento";
  return {
    id: `curso-${Date.now()}`,
    titulo: "",
    instrutor: "",
    plataforma: "Udemy",
    segmentos: [seg],
    ordem: 99,
    concluido: false,
  };
}

function emptyFerramenta(defaultSegmentos) {
  const seg = defaultSegmentos?.[0] ?? "desenvolvimento";
  return {
    id: `tool-${Date.now()}`,
    nome: "",
    categoria: "Ferramentas",
    segmentos: [seg],
  };
}

function ConteudoSemSegmentos() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-6 text-center">
      <p className="text-sm font-medium text-amber-950">Nenhuma área de vaga selecionada</p>
      <p className="mt-1 text-sm text-amber-900/80">
        Escolha em Segmentos para quais áreas você vai aplicar. O Conteúdo mostra só essas áreas.
      </p>
      <Link
        href="/segmentos"
        className="mt-4 inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
      >
        Ir para Segmentos
      </Link>
    </div>
  );
}

function MapPorSegmento({ value, onChange, label, rows = 2, segmentos = [] }) {
  return (
    <div className="space-y-2 rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      {segmentos.map((seg) => (
        <FormField key={seg.slug} label={seg.label} full>
          <textarea
            className={textareaClass}
            rows={rows}
            value={value?.[seg.slug] ?? ""}
            onChange={(e) => onChange({ ...value, [seg.slug]: e.target.value })}
          />
        </FormField>
      ))}
    </div>
  );
}

function BulletsPorSegmento({ value, onChange, segmentos = [] }) {
  return (
    <div className="space-y-2 rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Bullets por área</p>
      {segmentos.map((seg) => (
        <FormField key={seg.slug} label={seg.label} full>
          <textarea
            className={textareaClass}
            rows={4}
            value={(value?.[seg.slug] ?? []).join("\n")}
            onChange={(e) =>
              onChange({
                ...value,
                [seg.slug]: e.target.value
                  .split("\n")
                  .map((l) => l.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Um bullet por linha"
          />
        </FormField>
      ))}
    </div>
  );
}

function ViewCard({ title, subtitle, children, defaultOpen = false }) {
  return (
    <details className="overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-50/40" open={defaultOpen}>
      <summary className="cursor-pointer list-none px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
        <p className="text-sm font-medium text-zinc-800">{title}</p>
        {subtitle ? <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p> : null}
      </summary>
      <div className="border-t border-zinc-200/80 px-4 py-3">{children}</div>
    </details>
  );
}

function ProjetosView({ items, previewSlug, segmentosAtivos }) {
  if (!items?.length) return <p className="text-sm italic text-zinc-400">Nenhum projeto.</p>;

  const visiveis = items.filter((p) => (p.segmentos ?? []).includes(previewSlug));
  if (!visiveis.length) {
    return (
      <p className="text-sm italic text-zinc-400">
        Nenhum projeto marcado para {slugParaLabel(previewSlug, segmentosAtivos)}.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {visiveis.map((proj, i) => (
        <ViewCard
          key={proj.id}
          title={`${proj.nome}${proj.subtitulo_por_segmento?.[previewSlug] ? ` — ${proj.subtitulo_por_segmento[previewSlug]}` : ""}`}
          subtitle={proj.stack_por_segmento?.[previewSlug]}
          defaultOpen={i === 0}
        >
          {(proj.bullets_por_segmento?.[previewSlug] ?? []).length ? (
            <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700">
              {proj.bullets_por_segmento[previewSlug].map((b, bi) => (
                <li key={bi}>{b}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic text-zinc-400">Sem bullets nesta área.</p>
          )}
        </ViewCard>
      ))}
    </div>
  );
}

function ProjetosEdit({ banco, setBanco, updateProjeto, editSegment, segmentosAtivos }) {
  const slugs = segmentosAtivos.map((s) => s.slug);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          className="text-xs font-medium text-emerald-700 hover:underline"
          onClick={() => setBanco((p) => ({ ...p, projetos: [...(p.projetos ?? []), emptyProjeto(slugs)] }))}
        >
          + Projeto
        </button>
      </div>
      {(banco.projetos ?? []).map((proj, i) => (
        <details key={proj.id} className="rounded-lg border border-zinc-200 bg-white" open={i === 0}>
          <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium">{proj.nome || proj.id}</summary>
          <div className="space-y-2 border-t border-zinc-100 p-3">
            <FormField label="Nome">
              <input className={inputClass} value={proj.nome ?? ""} onChange={(e) => updateProjeto(i, { nome: e.target.value })} />
            </FormField>
            <SegmentChips
              value={proj.segmentos}
              onChange={(segmentos) => updateProjeto(i, { segmentos })}
              label="Aparece nas vagas de"
              segmentos={segmentosAtivos}
            />
            {(proj.segmentos ?? []).includes(editSegment) ? (
              <>
                <FormField label={`Subtítulo · ${slugParaLabel(editSegment, segmentosAtivos)}`} full>
                  <input
                    className={inputClass}
                    value={proj.subtitulo_por_segmento?.[editSegment] ?? ""}
                    onChange={(e) =>
                      updateProjeto(i, {
                        subtitulo_por_segmento: {
                          ...proj.subtitulo_por_segmento,
                          [editSegment]: e.target.value,
                        },
                      })
                    }
                  />
                </FormField>
                <FormField label={`Stack · ${slugParaLabel(editSegment, segmentosAtivos)}`} full>
                  <input
                    className={inputClass}
                    value={proj.stack_por_segmento?.[editSegment] ?? ""}
                    onChange={(e) =>
                      updateProjeto(i, {
                        stack_por_segmento: { ...proj.stack_por_segmento, [editSegment]: e.target.value },
                      })
                    }
                  />
                </FormField>
                <FormField label={`Bullets · ${slugParaLabel(editSegment, segmentosAtivos)}`} full>
                  <textarea
                    className={textareaClass}
                    rows={5}
                    value={(proj.bullets_por_segmento?.[editSegment] ?? []).join("\n")}
                    onChange={(e) =>
                      updateProjeto(i, {
                        bullets_por_segmento: {
                          ...proj.bullets_por_segmento,
                          [editSegment]: e.target.value
                            .split("\n")
                            .map((l) => l.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                  />
                </FormField>
              </>
            ) : (
              <p className="text-xs text-zinc-500">Marque a área em edição nos chips acima.</p>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}

function CursosEdit({ banco, updateCurso, setBanco, segmentosAtivos }) {
  const slugs = segmentosAtivos.map((s) => s.slug);

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button type="button" className="text-xs font-medium text-emerald-700 hover:underline" onClick={() => setBanco((p) => ({ ...p, cursos: [...(p.cursos ?? []), emptyCurso(slugs)] }))}>
          + Curso
        </button>
      </div>
      {(banco.cursos ?? []).map((curso, i) => (
        <div key={curso.id} className="rounded-lg border border-zinc-200 bg-white p-3">
          <FormField label="Título" full>
            <input className={inputClass} value={curso.titulo ?? ""} onChange={(e) => updateCurso(i, { titulo: e.target.value })} />
          </FormField>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <FormField label="Instrutor">
              <input className={inputClass} value={curso.instrutor ?? ""} onChange={(e) => updateCurso(i, { instrutor: e.target.value })} />
            </FormField>
            <FormField label="Plataforma">
              <input className={inputClass} value={curso.plataforma ?? ""} onChange={(e) => updateCurso(i, { plataforma: e.target.value })} />
            </FormField>
          </div>
          <div className="mt-2">
            <SegmentChips
              value={curso.segmentos}
              onChange={(segmentos) => updateCurso(i, { segmentos })}
              label="Áreas"
              segmentos={segmentosAtivos}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function FerramentasView({ items, previewSlug }) {
  const lista = (items ?? []).filter((f) => (f.segmentos ?? []).includes(previewSlug));
  if (!lista.length) return <p className="text-sm italic text-zinc-400">Nenhuma ferramenta nesta área.</p>;

  const byCat = new Map();
  for (const f of lista) {
    const cat = f.categoria || "Ferramentas";
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat).push(f.nome);
  }

  return (
    <div className="space-y-2">
      {[...byCat.entries()].map(([cat, nomes]) => (
        <ViewCard key={cat} title={cat} defaultOpen>
          <p className="text-sm text-zinc-700">{nomes.join(" · ")}</p>
        </ViewCard>
      ))}
    </div>
  );
}

function FerramentasEdit({ banco, setBanco, updateFerramenta, segmentosAtivos }) {
  const slugs = segmentosAtivos.map((s) => s.slug);

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          className="text-xs font-medium text-emerald-700 hover:underline"
          onClick={() =>
            setBanco((p) => ({ ...p, ferramentas: [...(p.ferramentas ?? []), emptyFerramenta(slugs)] }))
          }
        >
          + Ferramenta
        </button>
      </div>
      {(banco.ferramentas ?? []).map((f, i) => (
        <div key={f.id} className="rounded-lg border border-zinc-200 bg-white p-3">
          <FormField label="Nome">
            <input className={inputClass} value={f.nome ?? ""} onChange={(e) => updateFerramenta(i, { nome: e.target.value })} />
          </FormField>
          <FormField label="Categoria">
            <input
              className={inputClass}
              list="categorias-ferramenta"
              value={f.categoria ?? ""}
              onChange={(e) => updateFerramenta(i, { categoria: e.target.value })}
            />
            <datalist id="categorias-ferramenta">
              {CATEGORIAS_FERRAMENTA.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </FormField>
          <div className="mt-2">
            <SegmentChips
              value={f.segmentos}
              onChange={(segmentos) => updateFerramenta(i, { segmentos })}
              label="Áreas"
              segmentos={segmentosAtivos}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function useTabEditor() {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const snapshotRef = useRef(null);

  return {
    editing,
    saving,
    message,
    startEdit(banco) {
      snapshotRef.current = structuredClone(banco);
      setEditing(true);
      setMessage("");
    },
    cancelEdit(setBanco) {
      if (snapshotRef.current) setBanco(snapshotRef.current);
      snapshotRef.current = null;
      setEditing(false);
      setMessage("");
    },
    async saveEdit(banco, setBanco, setSegmentosAtivos) {
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
        if (data.segmentosAtivos && setSegmentosAtivos) {
          setSegmentosAtivos(data.segmentosAtivos);
        }
        snapshotRef.current = null;
        setEditing(false);
        setMessage("Salvo.");
      } catch (err) {
        setMessage(err.message || "Erro ao salvar");
      } finally {
        setSaving(false);
      }
    },
  };
}

export default function ConteudoEditor() {
  const [banco, setBanco] = useState(null);
  const [segmentosAtivos, setSegmentosAtivos] = useState([]);
  const [tab, setTab] = useState("experiencias");
  const [previewSlug, setPreviewSlug] = useState("");
  const [editSegment, setEditSegment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const tabEditor = useTabEditor();

  const slugs = segmentosAtivos.map((s) => s.slug);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/conteudo");
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error);
      setBanco(data.banco);
      setSegmentosAtivos(data.segmentosAtivos ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!slugs.length) return;
    if (!slugs.includes(previewSlug)) setPreviewSlug(slugs[0]);
    if (!slugs.includes(editSegment)) setEditSegment(slugs[0]);
  }, [slugs.join("|"), previewSlug, editSegment]);

  function switchTab(next) {
    setTab(next);
    tabEditor.cancelEdit(setBanco);
  }

  function updateProjeto(index, patch) {
    setBanco((prev) => {
      const projetos = [...(prev.projetos ?? [])];
      projetos[index] = { ...projetos[index], ...patch };
      return { ...prev, projetos };
    });
  }

  function updateCurso(index, patch) {
    setBanco((prev) => {
      const cursos = [...(prev.cursos ?? [])];
      cursos[index] = { ...cursos[index], ...patch };
      return { ...prev, cursos };
    });
  }

  function updateFerramenta(index, patch) {
    setBanco((prev) => {
      const ferramentas = [...(prev.ferramentas ?? [])];
      ferramentas[index] = { ...ferramentas[index], ...patch };
      return { ...prev, ferramentas };
    });
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-zinc-500">Carregando…</div>;
  }

  if (!banco) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-red-600">{error || "Indisponível"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-zinc-50/80 via-white to-zinc-50/40 pb-10">
      <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6">
        <div className="mb-4 flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              className={
                tab === t.id
                  ? "rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white"
                  : "rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        ) : null}

        {!segmentosAtivos.length ? <ConteudoSemSegmentos /> : null}

        {segmentosAtivos.length && tab === "experiencias" ? (
          <ExperienciasWorkspace banco={banco} setBanco={setBanco} segmentosAtivos={segmentosAtivos} />
        ) : null}

        {segmentosAtivos.length && tab !== "experiencias" ? (
          <>
            <div className="mb-3">
              <SegmentTabs value={previewSlug} onChange={setPreviewSlug} segmentos={segmentosAtivos} />
            </div>

            {tabEditor.editing ? (
              <div className="mb-3">
                <SegmentEditTabs value={editSegment} onChange={setEditSegment} segmentos={segmentosAtivos} />
              </div>
            ) : null}

            {tabEditor.message ? (
              <p className={`mb-2 text-right text-xs font-medium ${tabEditor.message === "Salvo." ? "text-emerald-700" : "text-red-600"}`}>
                {tabEditor.message}
              </p>
            ) : null}

            {tab === "cursos" ? (
              <ProfileSection
                title="Cursos"
                isEditing={tabEditor.editing}
                saving={tabEditor.saving}
                onEdit={() => tabEditor.startEdit(banco)}
                onCancel={() => tabEditor.cancelEdit(setBanco)}
                onSave={() => tabEditor.saveEdit(banco, setBanco, setSegmentosAtivos)}
                view={
                  <div className="space-y-2">
                    {(banco.cursos ?? [])
                      .filter((c) => (c.segmentos ?? []).includes(previewSlug))
                      .map((c) => (
                        <ViewCard key={c.id} title={c.titulo || c.id} subtitle={c.instrutor}>
                          <DataTags
                            items={(c.segmentos ?? []).map((s) => slugParaLabel(s, segmentosAtivos))}
                            tone="neutral"
                          />
                        </ViewCard>
                      ))}
                  </div>
                }
                edit={
                  <CursosEdit
                    banco={banco}
                    setBanco={setBanco}
                    updateCurso={updateCurso}
                    segmentosAtivos={segmentosAtivos}
                  />
                }
              />
            ) : null}

            {tab === "projetos" ? (
              <ProfileSection
                title="Projetos"
                isEditing={tabEditor.editing}
                saving={tabEditor.saving}
                onEdit={() => tabEditor.startEdit(banco)}
                onCancel={() => tabEditor.cancelEdit(setBanco)}
                onSave={() => tabEditor.saveEdit(banco, setBanco, setSegmentosAtivos)}
                view={
                  <ProjetosView
                    items={banco.projetos}
                    previewSlug={previewSlug}
                    segmentosAtivos={segmentosAtivos}
                  />
                }
                edit={
                  <ProjetosEdit
                    banco={banco}
                    setBanco={setBanco}
                    updateProjeto={updateProjeto}
                    editSegment={editSegment}
                    segmentosAtivos={segmentosAtivos}
                  />
                }
              />
            ) : null}

            {tab === "ferramentas" ? (
              <ProfileSection
                title="Ferramentas"
                isEditing={tabEditor.editing}
                saving={tabEditor.saving}
                onEdit={() => tabEditor.startEdit(banco)}
                onCancel={() => tabEditor.cancelEdit(setBanco)}
                onSave={() => tabEditor.saveEdit(banco, setBanco, setSegmentosAtivos)}
                view={<FerramentasView items={banco.ferramentas} previewSlug={previewSlug} />}
                edit={
                  <FerramentasEdit
                    banco={banco}
                    setBanco={setBanco}
                    updateFerramenta={updateFerramenta}
                    segmentosAtivos={segmentosAtivos}
                  />
                }
              />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
