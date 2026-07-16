"use client";

import { useCallback, useEffect, useState } from "react";
import ExperienciasWorkspace from "@/components/conteudo/ExperienciasWorkspace";
import {
  CursosEdit,
  CursosView,
  ProjetosEdit,
  ProjetosView,
  useTabEditor,
} from "@/components/conteudo/TrajetoriaEditor";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { ESCOPO_TUDO } from "@/lib/conteudoFiltro";

export default function TrajetoriaPerfil({ todosSegmentos: todosIniciais = [] }) {
  const escopo = ESCOPO_TUDO;
  const [banco, setBanco] = useState(null);
  const [segmentosAtivos, setSegmentosAtivos] = useState([]);
  const [todosSegmentos, setTodosSegmentos] = useState(todosIniciais);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const projetosEditor = useTabEditor();
  const cursosEditor = useTabEditor();

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
    return <p className="text-sm text-zinc-400">Carregando trajetória…</p>;
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

      <div id="sec-experiencia" className="scroll-mt-20">
        <ExperienciasWorkspace
          banco={banco}
          setBanco={setBanco}
          escopo={escopo}
          todosSegmentos={todosSegmentos}
          title="Experiência"
        />
      </div>

      <div id="sec-projetos" className="scroll-mt-20">
        {projetosEditor.message ? (
          <p
            className={`mb-2 text-right text-xs font-medium ${projetosEditor.message === "Salvo." ? "text-emerald-700" : "text-red-600"}`}
          >
            {projetosEditor.message}
          </p>
        ) : null}

        <ProfileSection
          title="Projetos"
          isEditing={projetosEditor.editing}
          saving={projetosEditor.saving}
          onEdit={() => projetosEditor.startEdit(banco)}
          onCancel={() => projetosEditor.cancelEdit(setBanco)}
          onSave={() =>
            projetosEditor.saveEdit(banco, setBanco, setSegmentosAtivos, setTodosSegmentos)
          }
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
      </div>

      <div id="sec-cursos" className="scroll-mt-20">
        {cursosEditor.message ? (
          <p
            className={`mb-2 text-right text-xs font-medium ${cursosEditor.message === "Salvo." ? "text-emerald-700" : "text-red-600"}`}
          >
            {cursosEditor.message}
          </p>
        ) : null}

        <ProfileSection
          title="Cursos e certificações"
          isEditing={cursosEditor.editing}
          saving={cursosEditor.saving}
          onEdit={() => cursosEditor.startEdit(banco)}
          onCancel={() => cursosEditor.cancelEdit(setBanco)}
          onSave={() => cursosEditor.saveEdit(banco, setBanco, setSegmentosAtivos, setTodosSegmentos)}
          view={
            <CursosView items={banco.cursos} escopo={escopo} todosSegmentos={todosSegmentos} />
          }
          edit={
            <CursosEdit
              banco={banco}
              setBanco={setBanco}
              updateCurso={updateCurso}
              todosSegmentos={todosSegmentos}
            />
          }
        />
      </div>
    </>
  );
}
