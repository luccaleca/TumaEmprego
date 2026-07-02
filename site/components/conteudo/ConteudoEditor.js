"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FormField,
  inputClass,
  textareaClass,
} from "@/components/profile/FormField";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { DataTags, DataText } from "@/components/profile/ViewData";
import { SEGMENTOS, slugParaLabel } from "@/lib/conteudoConstants";

const TABS = [
  { id: "experiencias", label: "Experiências" },
  { id: "projetos", label: "Projetos" },
  { id: "cursos", label: "Cursos" },
  { id: "competencias", label: "Competências" },
  { id: "modelo", label: "Modelo ATS" },
];

const SEGMENTO_HINT = SEGMENTOS.map((s) => `${s.slug} (${s.label})`).join(", ");

function parseSegmentos(text) {
  return String(text ?? "")
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function segmentosToString(list) {
  return (list ?? []).join(", ");
}

function emptyExperiencia() {
  return {
    id: `exp-${Date.now()}`,
    empresa: "",
    periodo: "",
    local: "",
    segmentos: ["dados-bi-analytics"],
    titulo_por_segmento: {},
    nota_por_segmento: {},
    bullets: [{ texto: "", segmentos: ["dados-bi-analytics"] }],
  };
}

function emptyProjeto() {
  return {
    id: `proj-${Date.now()}`,
    nome: "",
    segmentos: ["desenvolvimento"],
    ordem_por_segmento: {},
    subtitulo_por_segmento: {},
    stack_por_segmento: {},
    bullets_por_segmento: {},
  };
}

function emptyCurso() {
  return {
    id: `curso-${Date.now()}`,
    titulo: "",
    instrutor: "",
    plataforma: "Udemy",
    segmentos: ["desenvolvimento"],
    ordem: 99,
    concluido: false,
  };
}

function SegmentoField({ value, onChange, label = "Segmentos" }) {
  return (
    <FormField label={label} hint={SEGMENTO_HINT} full>
      <input
        className={inputClass}
        value={segmentosToString(value)}
        onChange={(e) => onChange(parseSegmentos(e.target.value))}
        placeholder="dados-bi-analytics, desenvolvimento"
      />
    </FormField>
  );
}

function MapPorSegmento({ value, onChange, label, rows = 2 }) {
  return (
    <div className="space-y-2 rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      {SEGMENTOS.map((seg) => (
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

function BulletsPorSegmento({ value, onChange }) {
  return (
    <div className="space-y-2 rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        Bullets por segmento
      </p>
      {SEGMENTOS.map((seg) => (
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

function OrdemPorSegmento({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {SEGMENTOS.map((seg) => (
        <FormField key={seg.slug} label={`Ordem · ${seg.label}`}>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={value?.[seg.slug] ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                [seg.slug]: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
        </FormField>
      ))}
    </div>
  );
}

function ViewBlock({ label, children }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ViewCard({ title, subtitle, meta, children, defaultOpen = false }) {
  return (
    <details
      className="group overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-50/40"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium leading-snug text-zinc-800">{title}</p>
            {subtitle ? <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p> : null}
            {meta ? <p className="mt-1 font-mono text-[10px] text-zinc-400">{meta}</p> : null}
          </div>
          <span
            aria-hidden
            className="mt-0.5 shrink-0 text-[10px] text-zinc-400 transition group-open:rotate-180"
          >
            ▼
          </span>
        </div>
      </summary>
      <div className="space-y-3 border-t border-zinc-200/80 px-4 py-3">{children}</div>
    </details>
  );
}

function ExperienciasView({ items }) {
  if (!items?.length) {
    return <p className="text-sm italic text-zinc-400">Nenhuma experiência cadastrada.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((exp, i) => (
        <ViewCard
          key={exp.id}
          title={exp.empresa || exp.id}
          subtitle={[exp.periodo, exp.local].filter(Boolean).join(" · ")}
          meta={exp.id}
          defaultOpen={i === 0}
        >
          <ViewBlock label="Segmentos">
            <DataTags items={(exp.segmentos ?? []).map(slugParaLabel)} />
          </ViewBlock>

          {SEGMENTOS.filter((s) => exp.titulo_por_segmento?.[s.slug]).map((seg) => (
            <ViewBlock key={seg.slug} label={`Título · ${seg.label}`}>
              <DataText>{exp.titulo_por_segmento[seg.slug]}</DataText>
            </ViewBlock>
          ))}

          {SEGMENTOS.filter((s) => exp.nota_por_segmento?.[s.slug]).map((seg) => (
            <ViewBlock key={seg.slug} label={`Nota · ${seg.label}`}>
              <DataText>{exp.nota_por_segmento[seg.slug]}</DataText>
            </ViewBlock>
          ))}

          {(exp.bullets ?? []).length ? (
            <ViewBlock label="Bullets">
              <ul className="space-y-2">
                {(exp.bullets ?? []).map((b, bi) => (
                  <li
                    key={bi}
                    className="rounded-lg border border-zinc-200/80 bg-white px-3 py-2 text-sm text-zinc-700"
                  >
                    <p>{b.texto || "—"}</p>
                    {b.segmentos?.length ? (
                      <div className="mt-1.5">
                        <DataTags items={b.segmentos.map(slugParaLabel)} tone="neutral" />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </ViewBlock>
          ) : null}
        </ViewCard>
      ))}
    </div>
  );
}

function ProjetosView({ items }) {
  if (!items?.length) {
    return <p className="text-sm italic text-zinc-400">Nenhum projeto cadastrado.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((proj, i) => (
        <ViewCard key={proj.id} title={proj.nome || proj.id} meta={proj.id} defaultOpen={i === 0}>
          <ViewBlock label="Segmentos">
            <DataTags items={(proj.segmentos ?? []).map(slugParaLabel)} />
          </ViewBlock>

          {SEGMENTOS.filter((s) => proj.ordem_por_segmento?.[s.slug] != null).length ? (
            <ViewBlock label="Ordem por segmento">
              <div className="flex flex-wrap gap-1.5">
                {SEGMENTOS.filter((s) => proj.ordem_por_segmento?.[s.slug] != null).map((seg) => (
                  <span
                    key={seg.slug}
                    className="rounded-full bg-white px-2.5 py-0.5 text-xs text-zinc-600 ring-1 ring-zinc-200"
                  >
                    {seg.label}: {proj.ordem_por_segmento[seg.slug]}
                  </span>
                ))}
              </div>
            </ViewBlock>
          ) : null}

          {SEGMENTOS.filter(
            (s) =>
              proj.subtitulo_por_segmento?.[s.slug] ||
              proj.stack_por_segmento?.[s.slug] ||
              proj.bullets_por_segmento?.[s.slug]?.length,
          ).map((seg) => (
            <div
              key={seg.slug}
              className="space-y-2 rounded-lg border border-zinc-200/80 bg-white/80 p-3"
            >
              <p className="text-xs font-semibold text-zinc-700">{seg.label}</p>
              {proj.subtitulo_por_segmento?.[seg.slug] ? (
                <p className="text-sm text-zinc-600">{proj.subtitulo_por_segmento[seg.slug]}</p>
              ) : null}
              {proj.stack_por_segmento?.[seg.slug] ? (
                <p className="text-xs text-zinc-500">
                  <span className="font-medium">Stack:</span> {proj.stack_por_segmento[seg.slug]}
                </p>
              ) : null}
              {(proj.bullets_por_segmento?.[seg.slug] ?? []).length ? (
                <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700">
                  {proj.bullets_por_segmento[seg.slug].map((b, bi) => (
                    <li key={bi}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </ViewCard>
      ))}
    </div>
  );
}

function CursosView({ items }) {
  if (!items?.length) {
    return <p className="text-sm italic text-zinc-400">Nenhum curso cadastrado.</p>;
  }

  const sorted = [...items].sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));

  return (
    <div className="space-y-2">
      {sorted.map((curso, i) => (
        <ViewCard
          key={curso.id}
          title={curso.titulo || curso.id}
          subtitle={[curso.instrutor, curso.plataforma].filter(Boolean).join(" · ")}
          meta={`ordem ${curso.ordem ?? "—"}${curso.concluido ? " · concluído" : ""}`}
          defaultOpen={i === 0}
        >
          <ViewBlock label="Segmentos">
            <DataTags items={(curso.segmentos ?? []).map(slugParaLabel)} />
          </ViewBlock>
          {curso.concluido ? (
            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">
              Concluído
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
              Em andamento / referência
            </span>
          )}
        </ViewCard>
      ))}
    </div>
  );
}

function CompetenciasView({ competencias }) {
  return (
    <div className="space-y-2">
      {SEGMENTOS.map((seg, i) => (
        <ViewCard key={seg.slug} title={seg.label} defaultOpen={i === 0}>
          <pre className="whitespace-pre-wrap rounded-lg border border-zinc-200/80 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-700">
            {competencias?.[seg.slug]?.trim() || "Não informado"}
          </pre>
        </ViewCard>
      ))}
    </div>
  );
}

function ExperienciasEdit({ banco, setBanco, updateExperiencia }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          className="text-xs font-medium text-emerald-700 hover:underline"
          onClick={() =>
            setBanco((p) => ({
              ...p,
              experiencias: [...(p.experiencias ?? []), emptyExperiencia()],
            }))
          }
        >
          + Adicionar experiência
        </button>
      </div>
      {(banco.experiencias ?? []).map((exp, i) => (
        <details key={exp.id} className="rounded-lg border border-zinc-200 bg-white" open={i === 0}>
          <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium text-zinc-800">
            {exp.empresa || exp.id}
          </summary>
          <div className="space-y-2 border-t border-zinc-100 p-3">
            <FormField label="ID">
              <input className={`${inputClass} bg-zinc-50`} readOnly value={exp.id} />
            </FormField>
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
            <SegmentoField
              value={exp.segmentos}
              onChange={(segmentos) => updateExperiencia(i, { segmentos })}
            />
            <MapPorSegmento
              label="Título por segmento"
              value={exp.titulo_por_segmento}
              onChange={(titulo_por_segmento) => updateExperiencia(i, { titulo_por_segmento })}
              rows={1}
            />
            <MapPorSegmento
              label="Nota por segmento"
              value={exp.nota_por_segmento}
              onChange={(nota_por_segmento) => updateExperiencia(i, { nota_por_segmento })}
              rows={2}
            />
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Bullets
              </p>
              {(exp.bullets ?? []).map((b, bi) => (
                <div key={bi} className="rounded border border-zinc-100 p-2">
                  <FormField label="Texto" full>
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
                  <SegmentoField
                    label="Segmentos deste bullet"
                    value={b.segmentos}
                    onChange={(segmentos) => {
                      const bullets = [...exp.bullets];
                      bullets[bi] = { ...bullets[bi], segmentos };
                      updateExperiencia(i, { bullets });
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                className="text-xs text-emerald-700"
                onClick={() =>
                  updateExperiencia(i, {
                    bullets: [
                      ...(exp.bullets ?? []),
                      { texto: "", segmentos: exp.segmentos ?? [] },
                    ],
                  })
                }
              >
                + Bullet
              </button>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

function ProjetosEdit({ banco, setBanco, updateProjeto }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          className="text-xs font-medium text-emerald-700 hover:underline"
          onClick={() =>
            setBanco((p) => ({ ...p, projetos: [...(p.projetos ?? []), emptyProjeto()] }))
          }
        >
          + Adicionar projeto
        </button>
      </div>
      {(banco.projetos ?? []).map((proj, i) => (
        <details key={proj.id} className="rounded-lg border border-zinc-200 bg-white" open={i === 0}>
          <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium text-zinc-800">
            {proj.nome || proj.id}
          </summary>
          <div className="space-y-2 border-t border-zinc-100 p-3">
            <FormField label="Nome">
              <input
                className={inputClass}
                value={proj.nome ?? ""}
                onChange={(e) => updateProjeto(i, { nome: e.target.value })}
              />
            </FormField>
            <SegmentoField
              value={proj.segmentos}
              onChange={(segmentos) => updateProjeto(i, { segmentos })}
            />
            <OrdemPorSegmento
              value={proj.ordem_por_segmento}
              onChange={(ordem_por_segmento) => updateProjeto(i, { ordem_por_segmento })}
            />
            <MapPorSegmento
              label="Subtítulo por segmento"
              value={proj.subtitulo_por_segmento}
              onChange={(subtitulo_por_segmento) => updateProjeto(i, { subtitulo_por_segmento })}
              rows={1}
            />
            <MapPorSegmento
              label="Stack por segmento"
              value={proj.stack_por_segmento}
              onChange={(stack_por_segmento) => updateProjeto(i, { stack_por_segmento })}
              rows={1}
            />
            <BulletsPorSegmento
              value={proj.bullets_por_segmento}
              onChange={(bullets_por_segmento) => updateProjeto(i, { bullets_por_segmento })}
            />
          </div>
        </details>
      ))}
    </div>
  );
}

function CursosEdit({ banco, updateCurso, setBanco }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          className="text-xs font-medium text-emerald-700 hover:underline"
          onClick={() =>
            setBanco((p) => ({ ...p, cursos: [...(p.cursos ?? []), emptyCurso()] }))
          }
        >
          + Adicionar curso
        </button>
      </div>
      {(banco.cursos ?? []).map((curso, i) => (
        <div key={curso.id} className="rounded-lg border border-zinc-200 bg-white p-3">
          <FormField label="Título" full>
            <input
              className={inputClass}
              value={curso.titulo ?? ""}
              onChange={(e) => updateCurso(i, { titulo: e.target.value })}
            />
          </FormField>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <FormField label="Instrutor">
              <input
                className={inputClass}
                value={curso.instrutor ?? ""}
                onChange={(e) => updateCurso(i, { instrutor: e.target.value })}
              />
            </FormField>
            <FormField label="Plataforma">
              <input
                className={inputClass}
                value={curso.plataforma ?? ""}
                onChange={(e) => updateCurso(i, { plataforma: e.target.value })}
              />
            </FormField>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <FormField label="Ordem">
              <input
                type="number"
                className={inputClass}
                value={curso.ordem ?? 99}
                onChange={(e) => updateCurso(i, { ordem: Number(e.target.value) })}
              />
            </FormField>
            <FormField label="Concluído">
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={!!curso.concluido}
                  onChange={(e) => updateCurso(i, { concluido: e.target.checked })}
                />
                Marcar como concluído
              </label>
            </FormField>
          </div>
          <div className="mt-2">
            <SegmentoField
              value={curso.segmentos}
              onChange={(segmentos) => updateCurso(i, { segmentos })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CompetenciasEdit({ banco, setBanco }) {
  return (
    <div className="space-y-3">
      {SEGMENTOS.map((seg) => (
        <FormField key={seg.slug} label={seg.label} full>
          <textarea
            className={textareaClass}
            rows={6}
            value={banco.competencias?.[seg.slug] ?? ""}
            onChange={(e) =>
              setBanco((p) => ({
                ...p,
                competencias: { ...(p.competencias ?? {}), [seg.slug]: e.target.value },
              }))
            }
          />
        </FormField>
      ))}
    </div>
  );
}

function useTabEditor(tabId) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const snapshotRef = useRef(null);

  function startEdit(banco) {
    snapshotRef.current = structuredClone(banco);
    setEditing(true);
    setMessage("");
  }

  function cancelEdit(setBanco) {
    if (snapshotRef.current) setBanco(snapshotRef.current);
    snapshotRef.current = null;
    setEditing(false);
    setMessage("");
  }

  async function saveEdit(banco, setBanco) {
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
      setMessage("Alterações salvas.");
    } catch (err) {
      setMessage(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return { tabId, editing, saving, message, startEdit, cancelEdit, saveEdit };
}

export default function ConteudoEditor() {
  const [banco, setBanco] = useState(null);
  const [modelo, setModelo] = useState("");
  const [tab, setTab] = useState("experiencias");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const expEditor = useTabEditor("experiencias");
  const projEditor = useTabEditor("projetos");
  const cursoEditor = useTabEditor("cursos");
  const compEditor = useTabEditor("competencias");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/conteudo");
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error);
      setBanco(data.banco);
      setModelo(data.modelo ?? "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function switchTab(nextTab) {
    setTab(nextTab);
    expEditor.cancelEdit(setBanco);
    projEditor.cancelEdit(setBanco);
    cursoEditor.cancelEdit(setBanco);
    compEditor.cancelEdit(setBanco);
  }

  function updateExperiencia(index, patch) {
    setBanco((prev) => {
      const experiencias = [...(prev.experiencias ?? [])];
      experiencias[index] = { ...experiencias[index], ...patch };
      return { ...prev, experiencias };
    });
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

  function StatusMessage({ message }) {
    if (!message) return null;
    return (
      <p
        className={`mb-2 text-right text-xs font-medium ${message.includes("salvas") ? "text-emerald-700" : "text-red-600"}`}
        role="status"
      >
        {message}
      </p>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-zinc-500">Carregando banco…</div>
    );
  }

  if (!banco) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-red-600">{error || "Banco indisponível"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-zinc-50/80 via-white to-zinc-50/40 pb-10">
      <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6">
        <header className="mb-4">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Conteúdo</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Banco de experiências, projetos e cursos usados para montar as{" "}
            <Link href="/curriculo" className="text-emerald-700 hover:underline">
              variações de currículo
            </Link>
            . O{" "}
            <Link href="/curriculo" className="text-emerald-700 hover:underline">
              cv-base
            </Link>{" "}
            mantém cabeçalho e formação; este banco alimenta o resto.
          </p>
        </header>

        <div className="mb-3 flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              className={
                tab === t.id
                  ? "rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800"
                  : "rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        ) : null}

        <div className="space-y-4">
          {tab === "experiencias" ? (
            <>
              <StatusMessage message={expEditor.message} />
              <ProfileSection
                title="Experiências"
                description="Trabalhos e estágios. Cada segmento pode ter título, nota e bullets diferentes."
                isEditing={expEditor.editing}
                saving={expEditor.saving}
                onEdit={() => expEditor.startEdit(banco)}
                onCancel={() => expEditor.cancelEdit(setBanco)}
                onSave={() => expEditor.saveEdit(banco, setBanco)}
                view={<ExperienciasView items={banco.experiencias} />}
                edit={
                  <ExperienciasEdit
                    banco={banco}
                    setBanco={setBanco}
                    updateExperiencia={updateExperiencia}
                  />
                }
              />
            </>
          ) : null}

          {tab === "projetos" ? (
            <>
              <StatusMessage message={projEditor.message} />
              <ProfileSection
                title="Projetos"
                description="Portfólio com versões por segmento (stack, subtítulo e bullets)."
                isEditing={projEditor.editing}
                saving={projEditor.saving}
                onEdit={() => projEditor.startEdit(banco)}
                onCancel={() => projEditor.cancelEdit(setBanco)}
                onSave={() => projEditor.saveEdit(banco, setBanco)}
                view={<ProjetosView items={banco.projetos} />}
                edit={
                  <ProjetosEdit banco={banco} setBanco={setBanco} updateProjeto={updateProjeto} />
                }
              />
            </>
          ) : null}

          {tab === "cursos" ? (
            <>
              <StatusMessage message={cursoEditor.message} />
              <ProfileSection
                title="Cursos e certificações"
                description="Aparecem na seção Certificações das versões adaptadas."
                isEditing={cursoEditor.editing}
                saving={cursoEditor.saving}
                onEdit={() => cursoEditor.startEdit(banco)}
                onCancel={() => cursoEditor.cancelEdit(setBanco)}
                onSave={() => cursoEditor.saveEdit(banco, setBanco)}
                view={<CursosView items={banco.cursos} />}
                edit={
                  <CursosEdit banco={banco} setBanco={setBanco} updateCurso={updateCurso} />
                }
              />
            </>
          ) : null}

          {tab === "competencias" ? (
            <>
              <StatusMessage message={compEditor.message} />
              <ProfileSection
                title="Competências por segmento"
                description="Bloco de competências que entra em cada versão adaptada."
                isEditing={compEditor.editing}
                saving={compEditor.saving}
                onEdit={() => compEditor.startEdit(banco)}
                onCancel={() => compEditor.cancelEdit(setBanco)}
                onSave={() => compEditor.saveEdit(banco, setBanco)}
                view={<CompetenciasView competencias={banco.competencias} />}
                edit={<CompetenciasEdit banco={banco} setBanco={setBanco} />}
              />
            </>
          ) : null}

          {tab === "modelo" ? (
            <ProfileSection
              title="Modelo ATS"
              description="Estrutura fixa que o motor preenche com dados deste banco + cv-base."
              readOnly
              view={
                <pre className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed whitespace-pre-wrap text-zinc-700">
                  {modelo || "Modelo não encontrado em dados/curriculo/modelo.md"}
                </pre>
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
