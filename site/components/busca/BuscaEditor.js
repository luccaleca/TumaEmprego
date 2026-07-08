"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import BuscaAlvosResumo from "@/components/busca/BuscaAlvosResumo";
import BuscaSegmentos from "@/components/busca/BuscaSegmentos";
import SegmentosTopo from "@/components/busca/SegmentosTopo";
import { contarAlvosTotais } from "@/lib/alvosSegmento";
import { buscarNoCatalogo } from "@/lib/buscaCatalogo";
import { buscaIgual, preferenciasFromBusca } from "@/lib/preferenciasBusca";
import {
  filtrarChavesTituloPorSenioridade,
  listarChavesTituloCompativeis,
  tituloCompativelComSenioridades,
} from "@/lib/tituloSenioridade";

function buscaCompativelComSenioridade(busca) {
  const prefs = preferenciasFromBusca(busca);
  return {
    ...busca,
    titulos_ativos: filtrarChavesTituloPorSenioridade(
      busca.titulos_ativos,
      prefs.senioridades,
    ),
  };
}

export default function BuscaEditor({ initial, catalogo }) {
  const router = useRouter();
  const inicial = useMemo(() => buscaCompativelComSenioridade(initial), [initial]);
  const [salvo, setSalvo] = useState(inicial);
  const [busca, setBusca] = useState(inicial);
  const [consulta, setConsulta] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [adaptacao, setAdaptacao] = useState(null);
  const [segmentoAberto, setSegmentoAberto] = useState(null);

  const dirty = useMemo(() => !buscaIgual(salvo, busca), [salvo, busca]);

  const segmentosAtivos = busca.segmentos_ativos ?? [];
  const titulosAtivos = busca.titulos_ativos ?? [];
  const podeSalvar = true;
  const preferencias = preferenciasFromBusca(busca);
  const buscando = consulta.trim().length > 0;

  const { resultados, highlightChaves } = useMemo(
    () => buscarNoCatalogo(catalogo, consulta, titulosAtivos, preferencias.senioridades),
    [catalogo, consulta, titulosAtivos, preferencias.senioridades],
  );

  const totalAlvos = useMemo(
    () => contarAlvosTotais(catalogo, busca),
    [catalogo, busca],
  );

  function setPreferencias(prefs) {
    setBusca((prev) => {
      const next = { ...prev, ...prefs };
      if (prefs.senioridades) {
        next.titulos_ativos = filtrarChavesTituloPorSenioridade(
          next.titulos_ativos,
          prefs.senioridades,
        );
      }
      return next;
    });
  }

  function toggleSegmento(slug) {
    setBusca((prev) => {
      const set = new Set(prev.segmentos_ativos ?? []);
      if (set.has(slug)) set.delete(slug);
      else set.add(slug);
      return { ...prev, segmentos_ativos: [...set] };
    });
  }

  function toggleTitulo(chave) {
    setBusca((prev) => {
      const set = new Set(prev.titulos_ativos ?? []);
      if (set.has(chave)) set.delete(chave);
      else set.add(chave);
      return { ...prev, titulos_ativos: [...set] };
    });
  }

  function marcarTodosSegmentos() {
    setBusca((prev) => {
      const senioridades = preferenciasFromBusca(prev).senioridades;
      return {
        ...prev,
        segmentos_ativos: (catalogo ?? []).map((a) => a.slug),
        titulos_ativos: listarChavesTituloCompativeis(catalogo, senioridades),
      };
    });
  }

  function desmarcarTodosSegmentos() {
    setBusca((prev) => ({
      ...prev,
      segmentos_ativos: [],
      titulos_ativos: [],
    }));
  }

  function irParaArea(chave) {
    const areaSlug = chave.split("/")[0];
    setSegmentoAberto(areaSlug);
    document.getElementById(`busca-area-${areaSlug}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  async function salvar() {
    setSaving(true);
    setMessage("");
    setAdaptacao(null);

    try {
      const res = await fetch("/api/busca", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ busca }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || data.error);

      setSalvo(data.busca);
      setBusca(data.busca);
      setAdaptacao(data.adaptacao ?? null);
      router.refresh();

      const n = data.adaptacao?.slots_total ?? data.adaptacao?.segmentacoes?.length ?? 0;
      const vis = data.adaptacao?.slots_visiveis ?? n;
      if (data.adaptacao?.status === "concluido") {
        setMessage(
          vis > 0
            ? `Salvo. ${vis} variação${vis > 1 ? "ões" : ""} visível${vis > 1 ? "is" : ""} (${n} slots fixos no disco).`
            : `Salvo. ${n} variações mantidas — ative segmentos para exibir.`,
        );
      } else if (data.adaptacao?.status === "pendente") {
        setMessage("Salvo. Adaptação pendente — veja Currículo.");
      } else {
        setMessage("Salvo. Revise Conteúdo se mudou as áreas ativas.");
      }
    } catch (err) {
      setMessage(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <SegmentosTopo
        preferencias={preferencias}
        onChange={setPreferencias}
        consulta={consulta}
        onConsultaChange={setConsulta}
        resultados={resultados}
        buscando={buscando}
        onToggleTitulo={toggleTitulo}
        onIrPara={irParaArea}
        totalAlvos={totalAlvos}
      />

      <BuscaSegmentos
        catalogo={catalogo}
        segmentosAtivos={segmentosAtivos}
        titulosAtivos={titulosAtivos}
        senioridades={preferencias.senioridades}
        onToggleSegmento={toggleSegmento}
        onToggleTitulo={toggleTitulo}
        onMarcarTodosSegmentos={marcarTodosSegmentos}
        onDesmarcarTodosSegmentos={desmarcarTodosSegmentos}
        buscando={buscando}
        highlightChaves={highlightChaves}
        abrirSegmento={segmentoAberto}
      />

      {segmentosAtivos.length ? (
        <BuscaAlvosResumo catalogo={catalogo} busca={busca} />
      ) : null}

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t border-zinc-200/80 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        {dirty ? (
          <button
            type="button"
            onClick={() => {
              setBusca(structuredClone(salvo));
              setAdaptacao(null);
            }}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Desfazer
          </button>
        ) : null}
        <button
          type="button"
          onClick={salvar}
          disabled={saving || !dirty || !podeSalvar}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>

      {message ? (
        <p
          className={`text-right text-xs font-medium ${message.startsWith("Salvo") ? "text-emerald-700" : "text-red-600"}`}
          role="status"
        >
          {message}
          {adaptacao?.status === "concluido" ? (
            <>
              {" "}
              <Link href="/curriculo" className="underline">
                Ver currículo
              </Link>
            </>
          ) : adaptacao?.status === "pendente" ? (
            <>
              {" "}
              <Link href="/curriculo" className="underline">
                Currículo
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
