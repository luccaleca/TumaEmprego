"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BuscaAlvosResumo from "@/components/busca/BuscaAlvosResumo";
import BuscaBuscador from "@/components/busca/BuscaBuscador";
import BuscaCargosSelecionados from "@/components/busca/BuscaCargosSelecionados";
import BuscaCatalogo from "@/components/busca/BuscaCatalogo";
import BuscaPreferencias from "@/components/busca/BuscaPreferencias";
import BuscaSegmentos, { segmentosFromTitulos } from "@/components/busca/BuscaSegmentos";
import { buscarNoCatalogo } from "@/lib/buscaCatalogo";
import { buscaIgual, preferenciasFromBusca } from "@/lib/preferenciasBusca";
import { listarTitulosAtivos } from "@/lib/vagaCatalogo";

export default function BuscaEditor({ initial, catalogo }) {
  const [salvo, setSalvo] = useState(initial);
  const [busca, setBusca] = useState(initial);
  const [consulta, setConsulta] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [adaptacao, setAdaptacao] = useState(null);

  const dirty = useMemo(() => !buscaIgual(salvo, busca), [salvo, busca]);

  const segmentosAtivos = busca.segmentos_ativos ?? [];
  const titulosAtivos = busca.titulos_ativos ?? [];
  const temCargos = titulosAtivos.length > 0;
  const titulosSalvaveis = useMemo(
    () =>
      titulosAtivos.filter((chave) => segmentosAtivos.includes(chave.split("/")[0])),
    [titulosAtivos, segmentosAtivos],
  );
  const podeSalvar = titulosSalvaveis.length > 0 && segmentosAtivos.length > 0;
  const preferencias = preferenciasFromBusca(busca);
  const chavesAtivas = useMemo(() => new Set(titulosAtivos), [titulosAtivos]);
  const buscando = consulta.trim().length > 0;

  const { resultados, highlightChaves, catalogoFiltrado } = useMemo(
    () => buscarNoCatalogo(catalogo, consulta, titulosAtivos),
    [catalogo, consulta, titulosAtivos],
  );

  const cargosSelecionados = useMemo(
    () => listarTitulosAtivos(catalogo, titulosAtivos),
    [catalogo, titulosAtivos],
  );

  const alvos = useMemo(
    () => listarTitulosAtivos(catalogo, titulosSalvaveis),
    [catalogo, titulosSalvaveis],
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
      const areaSlug = chave.split("/")[0];
      const segmentos = new Set(prev.segmentos_ativos ?? []);

      if (set.has(chave)) {
        set.delete(chave);
        const aindaTem = [...set].some((c) => c.startsWith(`${areaSlug}/`));
        if (!aindaTem) segmentos.delete(areaSlug);
      } else {
        set.add(chave);
        segmentos.add(areaSlug);
      }

      return {
        ...prev,
        titulos_ativos: [...set],
        segmentos_ativos: [...segmentos],
      };
    });
  }

  function irParaArea(chave) {
    const areaSlug = chave.split("/")[0];
    document.getElementById(`busca-area-${areaSlug}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  async function salvar() {
    setSaving(true);
    setMessage("");
    setAdaptacao(null);

    const segmentos = segmentosFromTitulos(titulosAtivos).filter((slug) =>
      segmentosAtivos.includes(slug),
    );
    const payload = {
      ...busca,
      segmentos_ativos: segmentos,
      titulos_ativos: titulosSalvaveis,
    };

    try {
      const res = await fetch("/api/busca", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ busca: payload }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || data.error);

      setSalvo(data.busca);
      setBusca(data.busca);
      setAdaptacao(data.adaptacao ?? null);

      if (data.adaptacao?.status === "concluido") {
        setMessage("Salvo. CV adaptado.");
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
    <div className="space-y-4">
      <BuscaBuscador
        value={consulta}
        onChange={setConsulta}
        resultados={resultados}
        buscando={buscando}
        onIrPara={irParaArea}
        onToggleTitulo={toggleTitulo}
      />

      {buscando ? (
        <BuscaCatalogo
          catalogo={catalogoFiltrado}
          chavesAtivas={chavesAtivas}
          highlightChaves={highlightChaves}
          onToggle={toggleTitulo}
          buscando={buscando}
        />
      ) : null}

      <BuscaCargosSelecionados alvos={cargosSelecionados} onRemove={toggleTitulo} />

      {temCargos ? (
        <BuscaSegmentos
          catalogo={catalogo}
          segmentosAtivos={segmentosAtivos}
          titulosAtivos={titulosAtivos}
          onToggle={toggleSegmento}
        />
      ) : null}

      <BuscaPreferencias
        preferencias={preferencias}
        onChange={setPreferencias}
        totalCargos={alvos.length}
      />

      {alvos.length ? (
        <BuscaAlvosResumo preferencias={preferencias} alvos={alvos} />
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="flex items-center gap-2">
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
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
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
