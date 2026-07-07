"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FormField,
  inputClass,
  textareaClass,
} from "@/components/profile/FormField";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { DataTags } from "@/components/profile/ViewData";
import ExperienciasWorkspace from "@/components/conteudo/ExperienciasWorkspace";
import { ConteudoFiltros } from "@/components/conteudo/ConteudoFiltros";
import {
  SegmentChips,
  SegmentEditTabs,
} from "@/components/conteudo/SegmentChips";
import { slugParaLabel } from "@/lib/conteudoConstants";
import {
  ESCOPO_TUDO,
  contarItensPorEscopo,
  escopoEhTudo,
  filtrarItensPorEscopo,
} from "@/lib/conteudoFiltro";
import {
  importarFerramentasDoPerfil,
  mesclarFerramentas,
} from "@/lib/ferramentasPerfil";

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
              <div className="space-y-3">
                {segs.map((slug) => {
                  const bullets = proj.bullets_por_segmento?.[slug] ?? [];
                  if (!bullets.length && !proj.subtitulo_por_segmento?.[slug]) return null;
                  return (
                    <div key={slug}>
                      <p className="text-xs font-medium text-zinc-600">
                        {slugParaLabel(slug, todosSegmentos)}
                        {proj.subtitulo_por_segmento?.[slug] ? ` — ${proj.subtitulo_por_segmento[slug]}` : ""}
                      </p>
                      {proj.stack_por_segmento?.[slug] ? (
                        <p className="text-xs text-zinc-500">{proj.stack_por_segmento[slug]}</p>
                      ) : null}
                      {bullets.length ? (
                        <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-zinc-700">
                          {bullets.map((b, bi) => (
                            <li key={bi}>{b}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </ViewCard>
          );
        }

        return (
          <ViewCard
            key={proj.id}
            title={`${tituloBase}${proj.subtitulo_por_segmento?.[escopo] ? ` — ${proj.subtitulo_por_segmento[escopo]}` : ""}`}
            subtitle={proj.stack_por_segmento?.[escopo]}
            defaultOpen={i === 0}
          >
            {(proj.bullets_por_segmento?.[escopo] ?? []).length ? (
              <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700">
                {proj.bullets_por_segmento[escopo].map((b, bi) => (
                  <li key={bi}>{b}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm italic text-zinc-400">Sem bullets nesta área.</p>
            )}
          </ViewCard>
        );
      })}
    </div>
  );
}

function ProjetosEdit({ banco, setBanco, updateProjeto, editSegment, todosSegmentos }) {
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
            {(proj.segmentos ?? []).includes(editSegment) ? (
              <>
                <FormField label={`Subtítulo · ${slugParaLabel(editSegment, todosSegmentos)}`} full>
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
                <FormField label={`Stack · ${slugParaLabel(editSegment, todosSegmentos)}`} full>
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
                <FormField label={`Bullets · ${slugParaLabel(editSegment, todosSegmentos)}`} full>
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
              segmentos={todosSegmentos}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function FerramentasView({ items, escopo, temSóPerfil }) {
  const lista = filtrarItensPorEscopo(items, escopo);
  if (!lista.length) {
    return (
      <p className="text-sm italic text-zinc-400">
        {escopoEhTudo(escopo)
          ? "Nada aqui ainda. Cadastre em Tecnologias ou use “Trazer do perfil”."
          : "Nenhuma ferramenta nesta área."}
      </p>
    );
  }

  const byCat = new Map();
  for (const f of lista) {
    const cat = f.categoria || "Ferramentas";
    if (!byCat.has(cat)) byCat.set(cat, []);
    const rotulo = f.nivel ? `${f.nome} (${f.nivel})` : f.nome;
    const sufixo = f.origem === "perfil" ? " · perfil" : "";
    byCat.get(cat).push(`${rotulo}${sufixo}`);
  }

  return (
    <div className="space-y-2">
      {temSóPerfil ? (
        <p className="rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2 text-xs text-sky-900">
          Itens marcados com <strong>perfil</strong> vêm de{" "}
          <Link href="/" className="font-medium underline">
            Perfil (Tecnologias)
          </Link>
          . Use “Trazer do perfil” para fixar áreas por CV e editar aqui.
        </p>
      ) : null}
      {[...byCat.entries()].map(([cat, nomes]) => (
        <ViewCard key={cat} title={cat} defaultOpen>
          <p className="text-sm text-zinc-700">{nomes.join(" · ")}</p>
        </ViewCard>
      ))}
    </div>
  );
}

function FerramentasEdit({ banco, setBanco, updateFerramenta, todosSegmentos }) {
  const slugs = todosSegmentos.map((s) => s.slug);

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
    async saveEdit(banco, setBanco, setSegmentosAtivos, setTodosSegmentos, setFerramentasPerfil) {
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
        if (data.todosSegmentos && setTodosSegmentos) {
          setTodosSegmentos(data.todosSegmentos);
        }
        if (data.ferramentasPerfil && setFerramentasPerfil) {
          setFerramentasPerfil(data.ferramentasPerfil);
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
  const [todosSegmentos, setTodosSegmentos] = useState([]);
  const [escopo, setEscopo] = useState(ESCOPO_TUDO);
  const [tipo, setTipo] = useState("experiencias");
  const [editSegment, setEditSegment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ferramentasPerfil, setFerramentasPerfil] = useState([]);
  const [importandoPerfil, setImportandoPerfil] = useState(false);
  const tabEditor = useTabEditor();

  const slugsCatalogo = todosSegmentos.map((s) => s.slug);

  const ferramentasExibidas = useMemo(
    () => mesclarFerramentas(banco?.ferramentas, ferramentasPerfil),
    [banco?.ferramentas, ferramentasPerfil],
  );

  const pendentesPerfil = useMemo(() => {
    const bancoNomes = new Set((banco?.ferramentas ?? []).map((f) => String(f.nome).toLowerCase()));
    return (ferramentasPerfil ?? []).filter((f) => f.nome && !bancoNomes.has(String(f.nome).toLowerCase()));
  }, [banco?.ferramentas, ferramentasPerfil]);

  const contagemPorTipo = useMemo(
    () => ({
      experiencias: contarItensPorEscopo(banco?.experiencias, escopo),
      projetos: contarItensPorEscopo(banco?.projetos, escopo),
      cursos: contarItensPorEscopo(banco?.cursos, escopo),
      ferramentas: contarItensPorEscopo(ferramentasExibidas, escopo),
    }),
    [banco, escopo, ferramentasExibidas],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/conteudo");
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error);
      setBanco(data.banco);
      setSegmentosAtivos(data.segmentosAtivos ?? []);
      setTodosSegmentos(data.todosSegmentos ?? data.segmentosAtivos ?? []);
      setFerramentasPerfil(data.ferramentasPerfil ?? []);
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
    if (!slugsCatalogo.length) return;
    if (!slugsCatalogo.includes(editSegment)) setEditSegment(slugsCatalogo[0]);
  }, [slugsCatalogo.join("|"), editSegment]);

  function switchTipo(next) {
    setTipo(next);
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

  async function importarFerramentasPerfil() {
    if (!banco || !pendentesPerfil.length) return;
    setImportandoPerfil(true);
    setError("");
    const atualizado = importarFerramentasDoPerfil(banco, ferramentasPerfil);
    try {
      const res = await fetch("/api/conteudo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banco: atualizado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error);
      setBanco(data.banco);
      setFerramentasPerfil(data.ferramentasPerfil ?? []);
    } catch (err) {
      setError(err.message || "Erro ao importar");
    } finally {
      setImportandoPerfil(false);
    }
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
        <div className="mb-2">
          <h1 className="text-lg font-semibold text-zinc-900">Conteúdo</h1>
          <p className="text-sm text-zinc-500">
            Tudo que você já fez — filtre por área ou tipo para ver o inventário.
          </p>
        </div>

        <ConteudoFiltros
          escopo={escopo}
          onEscopoChange={setEscopo}
          tipo={tipo}
          onTipoChange={switchTipo}
          todosSegmentos={todosSegmentos}
          contagemPorTipo={contagemPorTipo}
        />

        {error ? (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        ) : null}

        {!segmentosAtivos.length ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
            <p className="text-sm text-amber-950">
              Nenhuma área ativa em Segmentos — você ainda pode cadastrar tudo aqui. Para gerar CVs por vaga,{" "}
              <Link href="/segmentos" className="font-medium text-emerald-800 underline">
                escolha suas áreas
              </Link>
              .
            </p>
          </div>
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
            {tabEditor.editing ? (
              <div className="mb-3">
                <SegmentEditTabs value={editSegment} onChange={setEditSegment} segmentos={todosSegmentos} />
              </div>
            ) : null}

            {tabEditor.message ? (
              <p className={`mb-2 text-right text-xs font-medium ${tabEditor.message === "Salvo." ? "text-emerald-700" : "text-red-600"}`}>
                {tabEditor.message}
              </p>
            ) : null}

            {tipo === "cursos" ? (
              <ProfileSection
                title="Cursos"
                isEditing={tabEditor.editing}
                saving={tabEditor.saving}
                onEdit={() => tabEditor.startEdit(banco)}
                onCancel={() => tabEditor.cancelEdit(setBanco)}
                onSave={() =>
                  tabEditor.saveEdit(banco, setBanco, setSegmentosAtivos, setTodosSegmentos, setFerramentasPerfil)
                }
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
                title="Projetos"
                isEditing={tabEditor.editing}
                saving={tabEditor.saving}
                onEdit={() => tabEditor.startEdit(banco)}
                onCancel={() => tabEditor.cancelEdit(setBanco)}
                onSave={() =>
                  tabEditor.saveEdit(banco, setBanco, setSegmentosAtivos, setTodosSegmentos, setFerramentasPerfil)
                }
                view={
                  <ProjetosView
                    items={banco.projetos}
                    escopo={escopo}
                    todosSegmentos={todosSegmentos}
                  />
                }
                edit={
                  <ProjetosEdit
                    banco={banco}
                    setBanco={setBanco}
                    updateProjeto={updateProjeto}
                    editSegment={editSegment}
                    todosSegmentos={todosSegmentos}
                  />
                }
              />
            ) : null}

            {tipo === "ferramentas" ? (
              <>
                {pendentesPerfil.length && !tabEditor.editing ? (
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2">
                    <p className="text-xs text-emerald-950">
                      {pendentesPerfil.length} ferramenta(s) em{" "}
                      <Link href="/" className="font-medium underline">
                        Perfil → Tecnologias
                      </Link>{" "}
                      ainda não estão no banco de Conteúdo.
                    </p>
                    <button
                      type="button"
                      disabled={importandoPerfil}
                      onClick={importarFerramentasPerfil}
                      className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
                    >
                      {importandoPerfil ? "Importando…" : "Trazer do perfil"}
                    </button>
                  </div>
                ) : null}
                <ProfileSection
                  title="Ferramentas"
                  description="Stack técnico por área — alimenta a seção de competências do CV."
                  isEditing={tabEditor.editing}
                  saving={tabEditor.saving}
                  onEdit={() => tabEditor.startEdit(banco)}
                  onCancel={() => tabEditor.cancelEdit(setBanco)}
                  onSave={() =>
                    tabEditor.saveEdit(banco, setBanco, setSegmentosAtivos, setTodosSegmentos, setFerramentasPerfil)
                  }
                  view={
                    <FerramentasView
                      items={ferramentasExibidas}
                      escopo={escopo}
                      temSóPerfil={!(banco.ferramentas ?? []).length && ferramentasPerfil.length > 0}
                    />
                  }
                  edit={
                    <FerramentasEdit
                      banco={banco}
                      setBanco={setBanco}
                      updateFerramenta={updateFerramenta}
                      todosSegmentos={todosSegmentos}
                    />
                  }
                />
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
