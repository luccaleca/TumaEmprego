"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FormField, inputClass, textareaClass } from "@/components/profile/FormField";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { DataTags } from "@/components/profile/ViewData";
import ExperienciasWorkspace from "@/components/conteudo/ExperienciasWorkspace";
import { SegmentChips } from "@/components/conteudo/SegmentChips";
import { slugParaLabel } from "@/lib/conteudoConstants";
import {
  bulletsProjeto,
  projetoTemConteudoNoSegmento,
  resumoProjeto,
  rotuloStackUso,
  stackUsoParaTexto,
  stackUsoProjeto,
  textoParaStackUso,
} from "@/lib/projetosConteudo";
import {
  ESCOPO_TUDO,
  escopoEhTudo,
  filtrarItensPorEscopo,
} from "@/lib/conteudoFiltro";

const TITULOS = {
  experiencias: "Experiência",
  projetos: "Projetos",
  cursos: "Cursos e certificações",
};

export {
  ProjetosView,
  ProjetosEdit,
  CursosView,
  CursosEdit,
  useTabEditor,
  TITULOS,
};

function emptyProjeto(defaultSegmentos) {
  const seg = defaultSegmentos?.[0] ?? "desenvolvimento";
  return {
    id: `proj-${Date.now()}`,
    nome: "",
    segmentos: [seg],
    ordem_por_segmento: {},
    resumo_por_segmento: {},
    stack_uso_por_segmento: {},
    bullets_por_segmento: {},
  };
}

function BlocoProjetoSegmento({ proj, slug, todosSegmentos }) {
  const resumo = resumoProjeto(proj, slug);
  const stack = stackUsoProjeto(proj, slug);
  const bullets = bulletsProjeto(proj, slug);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-zinc-700">{slugParaLabel(slug, todosSegmentos)}</p>
      {resumo ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Finalidade</p>
          <p className="text-sm text-zinc-700">{resumo}</p>
        </div>
      ) : null}
      {stack.length ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">O que usou</p>
          <ul className="mt-1 space-y-1 text-sm text-zinc-700">
            {stack.map((item, idx) => (
              <li key={idx} className="leading-snug">
                {rotuloStackUso(item)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {bullets.length ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Resultados</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-zinc-700">
            {bullets.map((b, bi) => (
              <li key={bi}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
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

function ProjetosView({ items, escopo, todosSegmentos }) {
  const visiveis = filtrarItensPorEscopo(items, escopo);
  if (!visiveis.length) {
    return (
      <p className="text-sm italic text-zinc-400">
        {escopoEhTudo(escopo) ? "Nenhum projeto cadastrado." : "Nenhum projeto nesta área."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {visiveis.map((proj, i) => {
        const segs = proj.segmentos ?? [];
        const tituloBase = proj.nome || proj.id;

        if (escopoEhTudo(escopo)) {
          return (
            <ViewCard
              key={proj.id}
              title={tituloBase}
              subtitle={segs.map((s) => slugParaLabel(s, todosSegmentos)).join(" · ")}
              defaultOpen={i === 0}
            >
              <div className="space-y-4">
                {segs.filter((slug) => projetoTemConteudoNoSegmento(proj, slug)).map((slug) => (
                  <BlocoProjetoSegmento key={slug} proj={proj} slug={slug} todosSegmentos={todosSegmentos} />
                ))}
              </div>
            </ViewCard>
          );
        }

        const resumo = resumoProjeto(proj, escopo);

        return (
          <ViewCard
            key={proj.id}
            title={tituloBase}
            subtitle={resumo || undefined}
            defaultOpen={i === 0}
          >
            <BlocoProjetoSegmento proj={proj} slug={escopo} todosSegmentos={todosSegmentos} />
          </ViewCard>
        );
      })}
    </div>
  );
}

function ProjetosEdit({ banco, setBanco, updateProjeto, todosSegmentos }) {
  const slugs = todosSegmentos.map((s) => s.slug);

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
              label="Aparece nas áreas de"
              segmentos={todosSegmentos}
            />
            {(proj.segmentos ?? []).length ? (
              <div className="space-y-4">
                {(proj.segmentos ?? []).map((slug) => (
                  <div key={slug} className="space-y-2 rounded-lg border border-zinc-100 bg-zinc-50/40 p-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      {slugParaLabel(slug, todosSegmentos)}
                    </p>
                    <FormField label="Finalidade" full>
                      <textarea
                        className={textareaClass}
                        rows={2}
                        value={proj.resumo_por_segmento?.[slug] ?? resumoProjeto(proj, slug)}
                        onChange={(e) =>
                          updateProjeto(i, {
                            resumo_por_segmento: {
                              ...proj.resumo_por_segmento,
                              [slug]: e.target.value,
                            },
                          })
                        }
                      />
                    </FormField>
                    <FormField label="O que usou" hint="Uma linha por item: Tecnologia — para quê" full>
                      <textarea
                        className={textareaClass}
                        rows={4}
                        value={stackUsoParaTexto(stackUsoProjeto(proj, slug))}
                        onChange={(e) =>
                          updateProjeto(i, {
                            stack_uso_por_segmento: {
                              ...proj.stack_uso_por_segmento,
                              [slug]: textoParaStackUso(e.target.value),
                            },
                          })
                        }
                      />
                    </FormField>
                    <FormField label="Resultados" hint="Uma linha por entrega ou métrica" full>
                      <textarea
                        className={textareaClass}
                        rows={4}
                        value={(proj.bullets_por_segmento?.[slug] ?? []).join("\n")}
                        onChange={(e) =>
                          updateProjeto(i, {
                            bullets_por_segmento: {
                              ...proj.bullets_por_segmento,
                              [slug]: e.target.value
                                .split("\n")
                                .map((l) => l.trim())
                                .filter(Boolean),
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
          </div>
        </details>
      ))}
    </div>
  );
}

function CursosView({ items, escopo, todosSegmentos }) {
  const visiveis = filtrarItensPorEscopo(items, escopo);
  if (!visiveis.length) {
    return (
      <p className="text-sm italic text-zinc-400">
        {escopoEhTudo(escopo) ? "Nenhum curso cadastrado." : "Nenhum curso nesta área."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {visiveis.map((c, i) => (
        <ViewCard
          key={c.id}
          title={c.titulo || c.id}
          subtitle={[c.instrutor, c.plataforma].filter(Boolean).join(" · ")}
          defaultOpen={i === 0}
        >
          <DataTags
            items={(c.segmentos ?? []).map((s) => slugParaLabel(s, todosSegmentos))}
            tone="neutral"
          />
        </ViewCard>
      ))}
    </div>
  );
}

function CursosEdit({ banco, updateCurso, setBanco, todosSegmentos }) {
  const slugs = todosSegmentos.map((s) => s.slug);

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          className="text-xs font-medium text-emerald-700 hover:underline"
          onClick={() => setBanco((p) => ({ ...p, cursos: [...(p.cursos ?? []), emptyCurso(slugs)] }))}
        >
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
              segmentos={todosSegmentos}
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
    async saveEdit(banco, setBanco, setSegmentosAtivos, setTodosSegmentos) {
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
        if (data.segmentosAtivos) setSegmentosAtivos?.(data.segmentosAtivos);
        if (data.todosSegmentos) setTodosSegmentos?.(data.todosSegmentos);
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

export default function TrajetoriaEditor({ initialTipo = "experiencias", todosSegmentos: todosIniciais = [] }) {
  const tipo = initialTipo;
  const [banco, setBanco] = useState(null);
  const [segmentosAtivos, setSegmentosAtivos] = useState([]);
  const [todosSegmentos, setTodosSegmentos] = useState(todosIniciais);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const tabEditor = useTabEditor();
  const escopo = ESCOPO_TUDO;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/conteudo");
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error);
      setBanco(data.banco);
      setSegmentosAtivos(data.segmentosAtivos ?? []);
      if (!todosIniciais.length) {
        setTodosSegmentos(data.todosSegmentos ?? data.segmentosAtivos ?? []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [todosIniciais.length]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (todosIniciais.length) setTodosSegmentos(todosIniciais);
  }, [todosIniciais]);

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

  if (loading) {
    return <p className="text-sm text-zinc-400">…</p>;
  }

  if (!banco) {
    return <p className="text-sm text-red-600">{error || "Indisponível"}</p>;
  }

  return (
    <>
      {error ? (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      ) : null}

      {!segmentosAtivos.length ? (
        <p className="mb-4 text-sm text-amber-950">Nenhuma área ativa em Segmentos</p>
      ) : null}

      {tipo === "experiencias" ? (
        <ExperienciasWorkspace
          banco={banco}
          setBanco={setBanco}
          escopo={escopo}
          todosSegmentos={todosSegmentos}
        />
      ) : null}

      {tipo !== "experiencias" ? (
        <>
          {tabEditor.message ? (
            <p
              className={`mb-2 text-right text-xs font-medium ${tabEditor.message === "Salvo." ? "text-emerald-700" : "text-red-600"}`}
            >
              {tabEditor.message}
            </p>
          ) : null}

          {tipo === "cursos" ? (
            <ProfileSection
              title={TITULOS.cursos}
              isEditing={tabEditor.editing}
              saving={tabEditor.saving}
              onEdit={() => tabEditor.startEdit(banco)}
              onCancel={() => tabEditor.cancelEdit(setBanco)}
              onSave={() => tabEditor.saveEdit(banco, setBanco, setSegmentosAtivos, setTodosSegmentos)}
              view={<CursosView items={banco.cursos} escopo={escopo} todosSegmentos={todosSegmentos} />}
              edit={
                <CursosEdit
                  banco={banco}
                  setBanco={setBanco}
                  updateCurso={updateCurso}
                  todosSegmentos={todosSegmentos}
                />
              }
            />
          ) : null}

          {tipo === "projetos" ? (
            <ProfileSection
              title={TITULOS.projetos}
              isEditing={tabEditor.editing}
              saving={tabEditor.saving}
              onEdit={() => tabEditor.startEdit(banco)}
              onCancel={() => tabEditor.cancelEdit(setBanco)}
              onSave={() => tabEditor.saveEdit(banco, setBanco, setSegmentosAtivos, setTodosSegmentos)}
              view={
                <ProjetosView items={banco.projetos} escopo={escopo} todosSegmentos={todosSegmentos} />
              }
              edit={
                <ProjetosEdit
                  banco={banco}
                  setBanco={setBanco}
                  updateProjeto={updateProjeto}
                  todosSegmentos={todosSegmentos}
                />
              }
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
