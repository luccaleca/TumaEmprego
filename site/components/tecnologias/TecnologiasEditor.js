"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SegmentChips } from "@/components/conteudo/SegmentChips";
import { FormField, inputClass } from "@/components/profile/FormField";
import { FormSubsection } from "@/components/profile/FormSubsection";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { DataTags } from "@/components/profile/ViewData";
import { filtrarItensPorModo } from "@/lib/tecnologiasPopulares";
import { slugId } from "@/lib/tecnologiasStack";

const CATEGORIAS_EXTRA = [
  "Dados / back-end",
  "BI",
  "Front-end",
  "Back-end",
  "IA",
  "DevOps",
  "Marketing",
  "Ferramentas",
];

function VertenteTabs({ vertentes, ativas, onToggle }) {
  const set = new Set(ativas ?? []);

  return (
    <div className="flex flex-wrap gap-1.5">
      {vertentes.map((v) => {
        const on = set.has(v.slug);
        return (
          <button
            key={v.slug}
            type="button"
            onClick={() => onToggle(v.slug)}
            className={
              on
                ? "rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-medium text-white"
                : "rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-200"
            }
          >
            {v.nome}
          </button>
        );
      })}
    </div>
  );
}

function ModoListaToggle({ modo, onChange, totalPopulares, totalTodas }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChange("populares")}
        className={
          modo === "populares"
            ? "rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-800"
            : "rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-200"
        }
      >
        Populares ({totalPopulares})
      </button>
      <button
        type="button"
        onClick={() => onChange("todas")}
        className={
          modo === "todas"
            ? "rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-800"
            : "rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-200"
        }
      >
        Ver todas ({totalTodas})
      </button>
    </div>
  );
}

function ChipButton({ on, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        on
          ? "rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white"
          : "rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-200"
      }
    >
      {label}
    </button>
  );
}

function TecnologiaChips({ itens, ativas, onToggle }) {
  const selected = new Set(ativas ?? []);

  const porCategoria = useMemo(() => {
    const grupos = new Map();
    for (const item of itens ?? []) {
      const cat = item.categoria || "Geral";
      if (!grupos.has(cat)) grupos.set(cat, []);
      grupos.get(cat).push(item);
    }
    return [...grupos.entries()];
  }, [itens]);

  if (!itens?.length) {
    return <p className="text-sm italic text-zinc-400">—</p>;
  }

  return (
    <div className="space-y-4">
      {porCategoria.map(([categoria, lista]) => (
        <div key={categoria}>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            {categoria}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lista.map((item) => (
              <ChipButton
                key={item.slug}
                on={selected.has(item.slug)}
                label={item.nome}
                onClick={() => onToggle(item.slug)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function resumirSegmentos(segmentos, todosSegmentos) {
  const labels = (segmentos ?? [])
    .map((slug) => todosSegmentos.find((s) => s.slug === slug)?.label ?? slug)
    .map((l) => l.split(/[,&]/)[0].trim());
  return labels.length ? labels.join(" · ") : "—";
}

function BarraSelecionadas({
  catalogo,
  ativas,
  extras,
  segmentos,
  todosSegmentos,
  editing,
  onToggle,
  onSegmentos,
  onRemoveExtra,
}) {
  const mapa = useMemo(() => {
    const m = new Map();
    for (const v of catalogo ?? []) {
      for (const item of v.itens ?? []) {
        m.set(item.slug, item);
      }
    }
    return m;
  }, [catalogo]);

  const selecionadas = (ativas ?? []).map((slug) => mapa.get(slug)).filter(Boolean);

  if (!selecionadas.length && !extras?.length) {
    return <p className="text-sm italic text-zinc-400">—</p>;
  }

  return (
    <div className="space-y-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
      {selecionadas.map((item) => {
        const seg = segmentos[item.slug] ?? item.segmentosCv ?? [];
        return (
          <div key={item.slug} className="rounded-lg border border-white/80 bg-white/70 p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-zinc-900">{item.nome}</p>
              <button
                type="button"
                onClick={() => onToggle(item.slug)}
                className="text-[11px] font-medium text-zinc-500 hover:text-red-600"
              >
                Remover
              </button>
            </div>
            {editing ? (
              <SegmentChips
                value={seg}
                onChange={(next) => onSegmentos(item.slug, next)}
                label="Áreas no CV"
                segmentos={todosSegmentos}
              />
            ) : (
              <p className="text-[11px] text-zinc-500">{resumirSegmentos(seg, todosSegmentos)}</p>
            )}
          </div>
        );
      })}

      {(extras ?? []).map((extra) => (
        <div key={extra.id} className="rounded-lg border border-sky-100 bg-sky-50/50 p-2.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-zinc-900">
              {extra.nome}
              <span className="ml-1.5 text-[10px] font-semibold uppercase text-sky-700">extra</span>
            </p>
            <button
              type="button"
              onClick={() => onRemoveExtra(extra.id)}
              className="text-[11px] font-medium text-zinc-500 hover:text-red-600"
            >
              Remover
            </button>
          </div>
          {editing ? (
            <SegmentChips
              value={extra.segmentos ?? []}
              onChange={(next) => onRemoveExtra(extra.id, { ...extra, segmentos: next })}
              label="Áreas no CV"
              segmentos={todosSegmentos}
            />
          ) : (
            <p className="text-[11px] text-zinc-500">
              {resumirSegmentos(extra.segmentos, todosSegmentos)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function ExtrasEditor({ extras, todosSegmentos, onChange }) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("Ferramentas");

  function adicionar(event) {
    event.preventDefault();
    const trimmed = nome.trim();
    if (!trimmed) return;
    const id = `extra-${slugId(trimmed)}`;
    if (extras.some((e) => e.id === id || e.nome.toLowerCase() === trimmed.toLowerCase())) return;

    onChange([
      ...extras,
      {
        id,
        nome: trimmed,
        categoria: categoria.trim() || "Ferramentas",
        segmentos: todosSegmentos[0]?.slug ? [todosSegmentos[0].slug] : [],
      },
    ]);
    setNome("");
  }

  return (
    <form onSubmit={adicionar} className="space-y-2 rounded-lg border border-dashed border-zinc-200 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <FormField label="Nome">
          <input
            className={inputClass}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ferramenta fora do catálogo"
          />
        </FormField>
        <FormField label="Categoria">
          <input
            className={inputClass}
            list="categorias-stack-extra"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          />
          <datalist id="categorias-stack-extra">
            {CATEGORIAS_EXTRA.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </FormField>
      </div>
      <button
        type="submit"
        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
      >
        + Adicionar
      </button>
    </form>
  );
}

function buildSegmentosMap(tecnologias) {
  const map = { ...(tecnologias?.segmentos ?? {}) };
  for (const item of tecnologias?.itens ?? []) {
    if (!map[item.slug]?.length) {
      map[item.slug] = item.segmentosCv ?? [];
    }
  }
  return map;
}

export default function TecnologiasEditor({ initial, todosSegmentos = [] }) {
  const [catalogo, setCatalogo] = useState(initial?.catalogo ?? []);
  const [tecnologias, setTecnologias] = useState(
    initial?.tecnologias ?? { ativas: [], itens: [], extras: [] },
  );
  const [segmentos, setSegmentos] = useState(() => buildSegmentosMap(initial?.tecnologias));
  const [vertentesVisiveis, setVertentesVisiveis] = useState(
    initial?.catalogo?.[0]?.slug ? [initial.catalogo[0].slug] : ["dados"],
  );
  const [modoLista, setModoLista] = useState("populares");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!initial?.catalogo?.length);
  const [message, setMessage] = useState("");
  const snapshotRef = useRef(null);

  const mapaCatalogo = useMemo(() => {
    const m = new Map();
    for (const v of catalogo ?? []) {
      for (const item of v.itens ?? []) m.set(item.slug, item);
    }
    return m;
  }, [catalogo]);

  useEffect(() => {
    if (initial?.catalogo?.length) return;

    let cancelado = false;
    (async () => {
      try {
        const res = await fetch("/api/tecnologias");
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || data.error);
        if (cancelado) return;
        setCatalogo(data.catalogo ?? []);
        setTecnologias(data.tecnologias ?? { ativas: [], itens: [], extras: [] });
        setSegmentos(buildSegmentosMap(data.tecnologias));
        if (data.catalogo?.[0]?.slug) setVertentesVisiveis([data.catalogo[0].slug]);
      } catch (err) {
        if (!cancelado) setMessage(err.message || "Não carregou");
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [initial?.catalogo]);

  const ativasSet = new Set(tecnologias.ativas ?? []);
  const marcadas = [
    ...(tecnologias.itens ?? []).filter((i) => ativasSet.has(i.slug)).map((i) => i.nome),
    ...(tecnologias.extras ?? []).map((e) => e.nome),
  ];

  const vertentesEmTela = catalogo.filter((v) => vertentesVisiveis.includes(v.slug));

  function toggleVertenteVisivel(slug) {
    setVertentesVisiveis((prev) => {
      const set = new Set(prev);
      if (set.has(slug)) {
        if (set.size === 1) return prev;
        set.delete(slug);
      } else {
        set.add(slug);
      }
      return [...set];
    });
  }

  function toggleAtiva(slug) {
    setTecnologias((prev) => {
      const set = new Set(prev.ativas ?? []);
      if (set.has(slug)) {
        set.delete(slug);
      } else {
        set.add(slug);
        const item = mapaCatalogo.get(slug);
        if (item?.segmentosCv?.length) {
          setSegmentos((s) => ({ ...s, [slug]: s[slug]?.length ? s[slug] : [...item.segmentosCv] }));
        }
      }
      return { ...prev, ativas: [...set] };
    });
  }

  function updateSegmentos(slug, next) {
    setSegmentos((prev) => ({ ...prev, [slug]: next }));
  }

  function updateExtras(next) {
    setTecnologias((prev) => ({ ...prev, extras: next }));
  }

  function removeExtra(id, patch) {
    if (patch) {
      updateExtras((tecnologias.extras ?? []).map((e) => (e.id === id ? patch : e)));
      return;
    }
    updateExtras((tecnologias.extras ?? []).filter((e) => e.id !== id));
  }

  function startEdit() {
    snapshotRef.current = {
      tecnologias: structuredClone(tecnologias),
      segmentos: { ...segmentos },
      vertentesVisiveis: [...vertentesVisiveis],
      modoLista,
    };
    setEditing(true);
    setMessage("");
  }

  function cancelEdit() {
    if (snapshotRef.current) {
      setTecnologias(snapshotRef.current.tecnologias);
      setSegmentos(snapshotRef.current.segmentos);
      setVertentesVisiveis(snapshotRef.current.vertentesVisiveis);
      setModoLista(snapshotRef.current.modoLista);
    }
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
        body: JSON.stringify({
          ativas: tecnologias.ativas ?? [],
          extras: tecnologias.extras ?? [],
          segmentos,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || data.error);

      setCatalogo(data.catalogo ?? catalogo);
      setTecnologias(data.tecnologias);
      setSegmentos(buildSegmentosMap(data.tecnologias));
      snapshotRef.current = null;
      setEditing(false);
      setMessage("Salvo.");
    } catch (err) {
      setMessage(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ProfileSection title="Tecnologias" isEditing={false} view={<p className="text-sm text-zinc-400">…</p>} />
    );
  }

  return (
    <>
      {message ? (
        <p
          className={`mb-2 text-right text-xs font-medium ${message.includes("Salvo") || message.includes("salvo") ? "text-emerald-700" : "text-red-600"}`}
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
          marcadas.length ? (
            <DataTags items={marcadas} tone="neutral" />
          ) : (
            <p className="text-sm italic text-zinc-400">—</p>
          )
        }
        edit={
          <div className="space-y-5">
            <FormSubsection title="Selecionadas">
              <BarraSelecionadas
                catalogo={catalogo}
                ativas={tecnologias.ativas}
                extras={tecnologias.extras}
                segmentos={segmentos}
                todosSegmentos={todosSegmentos}
                editing
                onToggle={toggleAtiva}
                onSegmentos={updateSegmentos}
                onRemoveExtra={removeExtra}
              />
            </FormSubsection>

            <FormSubsection title="Fora do catálogo">
              <ExtrasEditor
                extras={tecnologias.extras ?? []}
                todosSegmentos={todosSegmentos}
                onChange={updateExtras}
              />
            </FormSubsection>

            <FormSubsection title="Catálogo">
              <div className="mb-3">
                <VertenteTabs
                  vertentes={catalogo}
                  ativas={vertentesVisiveis}
                  onToggle={toggleVertenteVisivel}
                />
              </div>
              <div className="mb-3">
                <ModoListaToggle
                  modo={modoLista}
                  onChange={setModoLista}
                  totalPopulares={vertentesEmTela.reduce(
                    (acc, v) =>
                      acc + filtrarItensPorModo(v.itens, v.slug, "populares").length,
                    0,
                  )}
                  totalTodas={vertentesEmTela.reduce(
                    (acc, v) => acc + (v.itens?.length ?? 0),
                    0,
                  )}
                />
              </div>

              <div className="space-y-6">
                {vertentesEmTela.map((vertente) => {
                  const itensVisiveis = filtrarItensPorModo(
                    vertente.itens,
                    vertente.slug,
                    modoLista,
                  );
                  const totalPop = filtrarItensPorModo(
                    vertente.itens,
                    vertente.slug,
                    "populares",
                  ).length;

                  return (
                    <div key={vertente.slug} className="rounded-lg border border-zinc-100 p-3">
                      <p className="mb-3 text-sm font-medium text-zinc-800">{vertente.nome}</p>
                      <TecnologiaChips
                        itens={itensVisiveis}
                        ativas={tecnologias.ativas}
                        onToggle={toggleAtiva}
                      />
                      {modoLista === "populares" && (vertente.itens?.length ?? 0) > totalPop ? (
                        <button
                          type="button"
                          onClick={() => setModoLista("todas")}
                          className="mt-3 text-[11px] font-medium text-emerald-700 hover:underline"
                        >
                          Ver todas
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </FormSubsection>
          </div>
        }
      />
    </>
  );
}
