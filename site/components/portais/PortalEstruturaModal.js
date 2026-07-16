"use client";



import { useEffect, useRef, useState } from "react";

import { BLOCOS_GUPY_CURRICULO, GUPY_CURRICULO_URL } from "@/lib/gupyCurriculoEstrutura";

import { ABAS_SOLIDES_VAGAS, SOLIDES_VAGAS_BASE } from "@/lib/solidesVagasEstrutura";

import { inputClass, textareaClass } from "@/components/profile/FormField";



function estruturaDoPortal(portal) {

  if (!portal) return null;



  if (portal.id === "solides") {

    return {

      url: SOLIDES_VAGAS_BASE,

      blocos: ABAS_SOLIDES_VAGAS.map((aba) => ({

        id: aba.id,

        titulo: aba.titulo,

        secoes: [

          {

            id: aba.id,

            titulo: null,

            campos: aba.campos,

          },

        ],

      })),

    };

  }



  if (portal.id === "gupy") {

    return {

      url: GUPY_CURRICULO_URL,

      blocos: BLOCOS_GUPY_CURRICULO,

    };

  }



  return {

    url: null,

    blocos: (portal.secoes ?? []).map((sec, i) => ({

      id: `sec-${i}`,

      titulo: sec.titulo,

      secoes: [{ id: `sec-${i}`, titulo: null, campos: [] }],

    })),

  };

}



function valorTexto(mapa, campoId) {

  const v = mapa?.[campoId];

  if (v == null) return "";

  if (Array.isArray(v)) {

    return v

      .map((item) => {

        if (typeof item === "string") return item;

        if (item?.nome && item?.nivel) return `${item.nome} (${item.nivel})`;

        if (item?.idioma && item?.nivel) return `${item.idioma} (${item.nivel})`;

        return "";

      })

      .filter(Boolean)

      .join("; ");

  }

  return String(v);

}



function draftFromMapa(estrutura, mapa) {

  const draft = {};

  for (const bloco of estrutura?.blocos ?? []) {

    for (const sec of bloco.secoes ?? []) {

      for (const campo of sec.campos ?? []) {

        draft[campo.id] = valorTexto(mapa, campo.id);

      }

    }

  }

  return draft;

}



function CampoLinha({ campo, valor, editing, onChange }) {

  const preenchido = Boolean(String(valor ?? "").trim());

  const longo =

    /apresentacao|atividades|descricao|resumo|trajetoria|cursos_certificacoes|consent|skills/i.test(

      campo.id,

    ) || String(valor ?? "").length > 80;



  return (

    <li className="text-sm">

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">

        <span className="font-medium text-zinc-900">

          {campo.label}

          {campo.obrigatorio ? <span className="text-rose-600"> *</span> : null}

        </span>

        {!editing && !preenchido ? (

          <span className="text-[11px] text-amber-700">Sem dados</span>

        ) : null}

      </div>

      {editing ? (

        longo ? (

          <textarea

            className={`${textareaClass} mt-1 min-h-[72px]`}

            rows={3}

            value={valor}

            onChange={(e) => onChange(campo.id, e.target.value)}

            aria-label={campo.label}

          />

        ) : (

          <input

            className={`${inputClass} mt-1`}

            value={valor}

            onChange={(e) => onChange(campo.id, e.target.value)}

            aria-label={campo.label}

          />

        )

      ) : preenchido ? (

        <p className="mt-0.5 whitespace-pre-wrap text-zinc-600">{valor}</p>

      ) : campo.hint ? (

        <p className="mt-0.5 text-xs text-zinc-400">{campo.hint}</p>

      ) : null}

    </li>

  );

}



function PortalEstruturaModal({ portal, valores = {}, onFechar, onSalvo }) {

  const [editing, setEditing] = useState(false);

  const [draft, setDraft] = useState({});

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const snapshotRef = useRef(null);



  const estrutura = estruturaDoPortal(portal);

  const mapa = portal ? valores[portal.id] ?? {} : {};

  const editavel = portal?.id === "solides" || portal?.id === "gupy";



  useEffect(() => {

    setEditing(false);

    setMessage("");

    snapshotRef.current = null;

    if (portal && estrutura) {

      setDraft(draftFromMapa(estrutura, valores[portal.id] ?? {}));

    } else {

      setDraft({});

    }

  }, [portal?.id]);



  useEffect(() => {

    if (!editing && portal && estrutura) {

      setDraft(draftFromMapa(estrutura, valores[portal.id] ?? {}));

    }

  }, [valores, editing, portal?.id]);



  if (!portal || !estrutura) return null;



  function iniciarEdicao() {

    snapshotRef.current = { ...draft };

    setEditing(true);

    setMessage("");

  }



  function cancelarEdicao() {

    setDraft(snapshotRef.current ?? draftFromMapa(estrutura, mapa));

    snapshotRef.current = null;

    setEditing(false);

    setMessage("");

  }



  function atualizarCampo(id, value) {

    setDraft((prev) => ({ ...prev, [id]: value }));

  }



  async function salvarEdicao() {

    setSaving(true);

    setMessage("");

    try {

      const res = await fetch(`/api/portais/${portal.id}/valores`, {

        method: "PUT",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ campos: draft }),

      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.error || data.detail || "Erro ao salvar");

      snapshotRef.current = null;

      setEditing(false);

      setMessage("Salvo.");

      onSalvo?.(portal.id, data.valores ?? draft);

    } catch (err) {

      setMessage(err.message || "Erro ao salvar");

    } finally {

      setSaving(false);

    }

  }



  const msgErro = Boolean(message) && !message.includes("Salvo");



  return (

    <div

      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm"

      role="dialog"

      aria-modal="true"

      aria-labelledby="portal-estrutura-titulo"

      onClick={editing ? undefined : onFechar}

    >

      <div

        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl"

        onClick={(e) => e.stopPropagation()}

      >

        <header className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">

          <div className="min-w-0">

            <p id="portal-estrutura-titulo" className="text-sm font-semibold text-zinc-900">

              {portal.nome}

            </p>

            {estrutura.url ? (

              <a

                href={estrutura.url}

                target="_blank"

                rel="noopener noreferrer"

                className="mt-0.5 block truncate text-xs text-violet-700 hover:underline"

              >

                {estrutura.url.replace(/^https?:\/\//, "")}

              </a>

            ) : null}

            {message ? (

              <p className={`mt-1 text-[11px] ${msgErro ? "text-rose-600" : "text-emerald-700"}`}>

                {message}

              </p>

            ) : null}

          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">

            {editavel && !editing ? (

              <button

                type="button"

                onClick={iniciarEdicao}

                className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"

              >

                Editar

              </button>

            ) : null}

            {editing ? (

              <>

                <button

                  type="button"

                  onClick={cancelarEdicao}

                  disabled={saving}

                  className="rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"

                >

                  Cancelar

                </button>

                <button

                  type="button"

                  onClick={salvarEdicao}

                  disabled={saving}

                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"

                >

                  {saving ? "Salvando…" : "Salvar"}

                </button>

              </>

            ) : (

              <button

                type="button"

                onClick={onFechar}

                className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"

              >

                Fechar

              </button>

            )}

          </div>

        </header>



        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3">

          {estrutura.blocos.map((bloco) => (

            <section key={bloco.id}>

              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">

                {bloco.titulo}

              </h3>

              <div className="mt-2 space-y-3">

                {bloco.secoes.map((sec) => (

                  <div key={sec.id}>

                    {sec.titulo ? (

                      <p className="mb-1 text-sm font-medium text-zinc-800">

                        {sec.titulo}

                        {sec.repetivel ? (

                          <span className="ml-1 text-xs font-normal text-zinc-400">· repetível</span>

                        ) : null}

                      </p>

                    ) : null}

                    {(sec.campos ?? []).length ? (

                      <ul className="space-y-2.5 border-l-2 border-zinc-100 pl-3">

                        {sec.campos.map((campo) => (

                          <CampoLinha

                            key={campo.id}

                            campo={campo}

                            valor={

                              editing

                                ? draft[campo.id] ?? ""

                                : valorTexto(mapa, campo.id)

                            }

                            editing={editing}

                            onChange={atualizarCampo}

                          />

                        ))}

                      </ul>

                    ) : (

                      <p className="text-sm text-zinc-500">{sec.nota ?? "—"}</p>

                    )}

                  </div>

                ))}

              </div>

            </section>

          ))}

        </div>

      </div>

    </div>

  );

}



export default PortalEstruturaModal;


