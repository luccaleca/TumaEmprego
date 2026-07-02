"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BuscaAlvosResumo from "@/components/busca/BuscaAlvosResumo";
import BuscaSegmentos from "@/components/busca/BuscaSegmentos";
import SegmentosTopo from "@/components/busca/SegmentosTopo";
import { contarAlvosTotais } from "@/lib/alvosSegmento";
import { buscarNoCatalogo } from "@/lib/buscaCatalogo";
import { buscaIgual, preferenciasFromBusca } from "@/lib/preferenciasBusca";

export default function BuscaEditor({ initial, catalogo }) {
  const [salvo, setSalvo] = useState(initial);
  const [busca, setBusca] = useState(initial);
  const [consulta, setConsulta] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [adaptacao, setAdaptacao] = useState(null);
  const [segmentoAberto, setSegmentoAberto] = useState(null);

  const dirty = useMemo(() => !buscaIgual(salvo, busca), [salvo, busca]);

  const segmentosAtivos = busca.segmentos_ativos ?? [];
  const titulosAtivos = busca.titulos_ativos ?? [];
  const podeSalvar = segmentosAtivos.length > 0;
  const preferencias = preferenciasFromBusca(busca);
  const buscando = consulta.trim().length > 0;

  const { resultados, highlightChaves } = useMemo(
    () => buscarNoCatalogo(catalogo, consulta, titulosAtivos),
    [catalogo, consulta, titulosAtivos],
  );

  const totalAlvos = useMemo(
    () => contarAlvosTotais(catalogo, busca),
    [catalogo, busca],
  );

  function setPreferencias(prefs) {
    setBusca((prev) => ({ ...prev, ...prefs }));
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

      const n = data.adaptacao?.segmentacoes?.length ?? 0;
      if (data.adaptacao?.status === "concluido") {
        setMessage(n > 1 ? `Salvo. ${n} currículos gerados.` : "Salvo. Currículo gerado.");
      } else if (data.adaptacao?.status === "pendente") {
        setMessage("Salvo. Adaptação pendente — veja Currículo.");
      } else {
        setMessage("Salvo.");
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
        onToggleSegmento={toggleSegmento}
        onToggleTitulo={toggleTitulo}
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
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
