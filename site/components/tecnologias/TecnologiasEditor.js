"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FormSubsection } from "@/components/profile/FormSubsection";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { DataTags } from "@/components/profile/ViewData";
import { filtrarItensPorModo } from "@/lib/tecnologiasPopulares";

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

function BarraSelecionadas({ catalogo, ativas, onToggle }) {
  const mapa = useMemo(() => {
    const m = new Map();
    for (const v of catalogo ?? []) {
      for (const item of v.itens ?? []) {
        m.set(item.slug, item);
      }
    }
    return m;
  }, [catalogo]);

  const selecionadas = (ativas ?? [])
    .map((slug) => mapa.get(slug))
    .filter(Boolean);

  if (!selecionadas.length) {
    return <p className="text-sm italic text-zinc-400">—</p>;
  }

  const porVertente = new Map();
  for (const item of selecionadas) {
    const chave = item.vertenteNome || item.vertenteSlug || "—";
    if (!porVertente.has(chave)) porVertente.set(chave, []);
    porVertente.get(chave).push(item);
  }

  return (
    <div className="space-y-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
      {[...porVertente.entries()].map(([vertente, lista]) => (
        <div key={vertente}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            {vertente}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lista.map((item) => (
              <ChipButton
                key={item.slug}
                on
                label={`${item.nome} ×`}
                onClick={() => onToggle(item.slug)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TecnologiasEditor({ initial }) {
  const [catalogo, setCatalogo] = useState(initial?.catalogo ?? []);
  const [tecnologias, setTecnologias] = useState(
    initial?.tecnologias ?? { ativas: [], itens: [] },
  );
  const [vertentesVisiveis, setVertentesVisiveis] = useState(
    initial?.catalogo?.[0]?.slug ? [initial.catalogo[0].slug] : ["dados"],
  );
  const [modoLista, setModoLista] = useState("populares");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!initial?.catalogo?.length);
  const [message, setMessage] = useState("");
  const snapshotRef = useRef(null);

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
        setTecnologias(data.tecnologias ?? { ativas: [], itens: [] });
        if (data.catalogo?.[0]?.slug) setVertentesVisiveis([data.catalogo[0].slug]);
      } catch (err) {
        if (!cancelado) setMessage(err.message || "Erro ao carregar catálogo");
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [initial?.catalogo]);

  const ativasSet = new Set(tecnologias.ativas ?? []);
  const marcadas = (tecnologias.itens ?? [])
    .filter((i) => ativasSet.has(i.slug))
    .map((i) => i.nome);

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
      if (set.has(slug)) set.delete(slug);
      else set.add(slug);
      return { ...prev, ativas: [...set] };
    });
  }

  function startEdit() {
    snapshotRef.current = {
      tecnologias: { ...tecnologias, ativas: [...(tecnologias.ativas ?? [])] },
      vertentesVisiveis: [...vertentesVisiveis],
      modoLista,
    };
    setEditing(true);
    setMessage("");
  }

  function cancelEdit() {
    if (snapshotRef.current) {
      setTecnologias(snapshotRef.current.tecnologias);
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
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || data.error);

      setCatalogo(data.catalogo ?? catalogo);
      setTecnologias(data.tecnologias);
      snapshotRef.current = null;
      setEditing(false);
      setMessage("Alterações salvas.");
    } catch (err) {
      setMessage(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ProfileSection
        title="Tecnologias"
        isEditing={false}
        view={<p className="text-sm text-zinc-400">…</p>}
      />
    );
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
                onToggle={toggleAtiva}
              />
            </FormSubsection>

            <FormSubsection title="Áreas">
              <VertenteTabs
                vertentes={catalogo}
                ativas={vertentesVisiveis}
                onToggle={toggleVertenteVisivel}
              />
            </FormSubsection>

            <FormSubsection title="Catálogo">
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
