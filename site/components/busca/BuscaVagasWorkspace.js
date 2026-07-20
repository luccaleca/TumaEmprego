"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LABEL_MODALIDADE } from "@/lib/buscaOpcoes";
import { PORTAIS_BUSCA, portaisBuscaDefault } from "@/lib/buscaPortais";
import { LABELS_SEGMENTO } from "@/lib/conteudoConstants";
import { temaSegmento } from "@/lib/cvSegmentoTema";
import { labelPortal } from "@/lib/portalLabels";
import { labelsSenioridades } from "@/lib/preferenciasBusca";
import { inputClass } from "@/components/profile/FormField";
import { normalizarTexto, tokenizarConsulta } from "@/lib/buscaBusca";
import { senioridadeBate } from "@/lib/filtrarVagaBusca";
import { localizacaoProxima, rotuloLocalCurto } from "@/lib/localizacaoBusca";

function hrefVaga(v) {
  const q = new URLSearchParams();
  if (v.titulo) q.set("titulo", v.titulo);
  if (v.empresa) q.set("empresa", v.empresa);
  if (v.url) q.set("url", v.url);
  if (v.descricao) q.set("descricao", v.descricao.slice(0, 6000));
  if (v.segmento_sugerido) q.set("segmento", v.segmento_sugerido);
  return `/vaga?${q.toString()}`;
}

function notaClass(nota, elegivel) {
  if (elegivel) return "bg-emerald-100 text-emerald-900";
  if (nota >= 3) return "bg-amber-100 text-amber-900";
  return "bg-zinc-100 text-zinc-600";
}

function labelSeg(slug) {
  return LABELS_SEGMENTO[slug] ?? slug;
}

function labelSegCurto(slug) {
  const map = {
    "dados-bi-analytics": "Dados",
    desenvolvimento: "Dev",
    "engenharia-software": "Eng",
    "marketing-growth": "Growth",
    "ia-ml": "IA",
  };
  return map[slug] ?? labelSeg(slug);
}

function slotDoSegmento(segmentacoes, slug) {
  if (!slug || !segmentacoes?.length) return null;
  return (
    segmentacoes.find(
      (s) =>
        s.segmento_slug === slug &&
        (s.slot || s.id === `seg-var-${slug}`) &&
        (s.hasMd || s.hasPdf),
    ) ?? null
  );
}

function Chip({ active, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        (active
          ? "rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-900"
          : "rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-500 hover:bg-zinc-200") +
        (className ? ` ${className}` : "")
      }
    >
      {children}
    </button>
  );
}

export default function BuscaVagasWorkspace() {
  const [relatorio, setRelatorio] = useState(null);
  const [busca, setBusca] = useState(null);
  const [profile, setProfile] = useState(null);
  const [segmentacoes, setSegmentacoes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [soElegiveis, setSoElegiveis] = useState(false);
  const [portais, setPortais] = useState(portaisBuscaDefault);
  const [filtroMod, setFiltroMod] = useState([]);
  const [filtroSeg, setFiltroSeg] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [editandoLugar, setEditandoLugar] = useState(false);
  const [lugarOverride, setLugarOverride] = useState("");

  const carregarPrefs = useCallback(async () => {
    try {
      const [buscaRes, perfilRes, cvRes] = await Promise.all([
        fetch("/api/busca"),
        fetch("/api/perfil"),
        fetch("/api/curriculo/segmentacoes"),
      ]);
      const data = await buscaRes.json();
      const perfilData = await perfilRes.json();
      const cvData = await cvRes.json().catch(() => ({}));
      if (!buscaRes.ok) throw new Error(data.error);
      const b = data.busca;
      setBusca(b);
      setFiltroMod(b?.modalidades_trabalho ?? []);
      setFiltroSeg(b?.segmentos_ativos ?? []);
      if (perfilRes.ok) setProfile(perfilData.profile ?? null);
      if (cvRes.ok) setSegmentacoes(cvData.segmentacoes ?? []);
    } catch (err) {
      setMessage(err.message || "Não carregou busca");
    }
  }, []);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/busca/vagas");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRelatorio(data);
      if (data.filtros) {
        setFiltroMod(data.filtros.modalidades_trabalho ?? []);
        if (data.filtros.segmentos_ativos?.length) {
          setFiltroSeg(data.filtros.segmentos_ativos);
        }
      }
    } catch (err) {
      setMessage(err.message || "Não carregou");
    }
  }, []);

  useEffect(() => {
    carregarPrefs();
    carregar();
  }, [carregar, carregarPrefs]);

  async function buscar() {
    const lista = PORTAIS_BUSCA.filter((p) => portais[p.id]).map((p) => p.id);
    if (!lista.length) {
      setMessage("Marque ao menos um portal.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      await carregarPrefs();
      const res = await fetch("/api/busca/vagas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portais: lista, soElegiveis: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRelatorio(data);
      if (data.filtros) {
        setFiltroMod(data.filtros.modalidades_trabalho ?? []);
        if (data.filtros.segmentos_ativos?.length) {
          setFiltroSeg(data.filtros.segmentos_ativos);
        }
      }
      const eleg = data.total_elegiveis ?? 0;
      const total = data.total_coletadas ?? 0;
      const fora = data.total_filtradas_fora ?? 0;
      setMessage(
        fora > 0
          ? `${total} vagas · ${eleg} ≥ ${data.nota_minima ?? 4} · ${fora} fora do filtro`
          : `${total} vagas · ${eleg} ≥ ${data.nota_minima ?? 4}`,
      );
      if (data.erros?.length) {
        setMessage((m) => `${m} · ${data.erros[0]}`);
      }
    } catch (err) {
      setMessage(err.message || "Não buscou");
    } finally {
      setBusy(false);
    }
  }

  function toggle(lista, setLista, value, permitidos) {
    if (permitidos && !permitidos.includes(value)) return;
    setLista((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value],
    );
  }

  const prefs = relatorio?.filtros ?? busca;
  const modDisponiveis = prefs?.modalidades_trabalho ?? [];
  const segDisponiveis =
    prefs?.segmentos_ativos?.length > 0
      ? prefs.segmentos_ativos
      : (busca?.segmentos_ativos ?? []);

  const cvsProntos = useMemo(() => {
    const ativos = new Set(segDisponiveis);
    return segmentacoes.filter(
      (s) =>
        (s.slot || s.id?.startsWith("seg-var-")) &&
        (s.hasMd || s.hasPdf) &&
        (!ativos.size || ativos.has(s.segmento_slug)),
    );
  }, [segmentacoes, segDisponiveis]);

  const vagas = useMemo(() => {
    let lista = relatorio?.vagas ?? [];
    if (soElegiveis) lista = lista.filter((v) => v.elegivel);

    const modAtivos = filtroMod.length > 0 ? filtroMod : modDisponiveis;

    if (modAtivos.length && filtroMod.length > 0 && filtroMod.length < modDisponiveis.length) {
      lista = lista.filter((v) => !v.modalidade || modAtivos.includes(v.modalidade));
    }

    if (
      filtroSeg.length > 0 &&
      segDisponiveis.length > 0 &&
      filtroSeg.length < segDisponiveis.length
    ) {
      lista = lista.filter(
        (v) => !v.segmento_sugerido || filtroSeg.includes(v.segmento_sugerido),
      );
    }

    const senioridadesAtivas = prefs?.senioridades ?? busca?.senioridades ?? [];
    if (senioridadesAtivas.length) {
      lista = lista.filter((v) => senioridadeBate(v, senioridadesAtivas).ok);
    }

    const lugar = lugarOverride.trim();
    if (lugar) {
      const q = normalizarTexto(lugar);
      lista = lista.filter((v) => {
        const blob = normalizarTexto(`${v.cidade ?? ""} ${v.estado ?? ""}`);
        return blob.includes(q);
      });
    } else if (profile) {
      lista = lista.filter((v) => localizacaoProxima(v, profile).ok);
    }

    const nome = filtroNome.trim();
    if (nome) {
      const tokens = tokenizarConsulta(nome);
      lista = lista.filter((v) => {
        const blob = normalizarTexto(`${v.titulo ?? ""} ${v.empresa ?? ""}`);
        return tokens.every((t) => blob.includes(t));
      });
    }

    return lista;
  }, [
    relatorio,
    soElegiveis,
    filtroMod,
    modDisponiveis,
    filtroSeg,
    segDisponiveis,
    prefs,
    busca,
    profile,
    filtroNome,
    lugarOverride,
  ]);

  const localRotulo =
    lugarOverride.trim() ||
    relatorio?.filtros?.local_perfil?.estado?.toUpperCase() ||
    (profile ? rotuloLocalCurto(profile)?.replace(/[()]/g, "") : null);
  const localExibir = localRotulo ? `(${localRotulo})` : null;

  const totalLista = relatorio?.vagas?.length ?? 0;
  const mostrando = vagas.length;
  const elegiveisVisiveis = vagas.filter((v) => v.elegivel).length;
  const notaMin = relatorio?.nota_minima ?? prefs?.nota_minima ?? 4;

  const perfilNome = String(profile?.nome ?? "")
    .trim()
    .split(/\s+/)[0];
  const senioridades = prefs?.senioridades ?? busca?.senioridades ?? [];

  const msgErro = /Não|Marque|Defina|erro/i.test(message);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Busca</h1>
          {relatorio?.gerado_em ? (
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {new Date(relatorio.gerado_em).toLocaleString("pt-BR")}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={buscar}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? "Buscando…" : "Buscar vagas"}
        </button>
      </header>

      <section className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-zinc-200/90 bg-white px-3 py-2 text-[11px] text-zinc-600 shadow-sm">
        <Link href="/" className="font-medium text-zinc-800 hover:text-emerald-700">
          {perfilNome || "Perfil"}
          {localExibir ? ` ${localExibir}` : ""}
        </Link>
        <span className="text-zinc-300" aria-hidden>
          ·
        </span>
        <Link href="/segmentos" className="hover:text-emerald-700">
          {segDisponiveis.length
            ? `${segDisponiveis.length} segmento${segDisponiveis.length === 1 ? "" : "s"}`
            : "Segmentos"}
        </Link>
        {senioridades.length ? (
          <>
            <span className="text-zinc-300" aria-hidden>
              ·
            </span>
            <span>{labelsSenioridades(senioridades)}</span>
          </>
        ) : null}
        <span className="text-zinc-300" aria-hidden>
          ·
        </span>
        <Link href="/curriculo" className="hover:text-emerald-700">
          {cvsProntos.length} CV{cvsProntos.length === 1 ? "" : "s"}
        </Link>
      </section>

      <section className="mb-4 rounded-xl border border-zinc-200/90 bg-white p-3 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-xs font-semibold text-zinc-800">Filtros</p>
            {localExibir ? (
              <span className="text-[11px] text-zinc-400">{localExibir}</span>
            ) : null}
            {editandoLugar ? (
              <input
                type="search"
                autoFocus
                value={lugarOverride}
                onChange={(e) => setLugarOverride(e.target.value)}
                onBlur={() => {
                  if (!lugarOverride.trim()) setEditandoLugar(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape") setEditandoLugar(false);
                }}
                placeholder="SP, RJ…"
                className="w-16 rounded border border-zinc-200 px-1.5 py-0.5 text-[11px] text-zinc-700"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditandoLugar(true)}
                className="text-[10px] font-medium text-emerald-700 hover:underline"
              >
                Editar
              </button>
            )}
            {lugarOverride.trim() && !editandoLugar ? (
              <button
                type="button"
                onClick={() => {
                  setLugarOverride("");
                  setEditandoLugar(false);
                }}
                className="text-[10px] text-zinc-400 hover:text-zinc-600"
              >
                ×
              </button>
            ) : null}
          </div>
          <Link href="/segmentos" className="text-[11px] font-medium text-emerald-700 hover:underline">
            Segmentos
          </Link>
        </div>

        {segDisponiveis.length ? (
          <div className="mb-2">
            <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-400">Segmento</p>
            <div className="flex flex-wrap gap-1.5">
              {segDisponiveis.map((slug) => {
                const tema = temaSegmento(slug);
                const slot = slotDoSegmento(segmentacoes, slug);
                const ativo = filtroSeg.includes(slug);
                return (
                  <Chip
                    key={slug}
                    active={ativo}
                    onClick={() => toggle(filtroSeg, setFiltroSeg, slug, segDisponiveis)}
                    className={ativo ? tema.badge : ""}
                  >
                    {labelSegCurto(slug)}
                    {slot ? " · CV" : ""}
                  </Chip>
                );
              })}
            </div>
          </div>
        ) : null}

        {modDisponiveis.length ? (
          <div className="mb-2">
            <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-400">Modalidade</p>
            <div className="flex flex-wrap gap-1.5">
              {modDisponiveis.map((slug) => (
                <Chip
                  key={slug}
                  active={filtroMod.includes(slug)}
                  onClick={() => toggle(filtroMod, setFiltroMod, slug, modDisponiveis)}
                >
                  {LABEL_MODALIDADE[slug] ?? slug}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mb-2">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-400">Cargo ou empresa</p>
          <input
            type="search"
            value={filtroNome}
            onChange={(e) => setFiltroNome(e.target.value)}
            placeholder="Ex.: analista de dados, Safra"
            className={inputClass}
          />
        </div>

        <p className="text-[11px] text-zinc-500">
          {prefs?.modo_label || prefs?.modo_busca || "focado"}
          {prefs?.nota_minima ? ` · nota ≥ ${prefs.nota_minima}` : ""}
          {prefs?.titulos_consulta?.length
            ? ` · ${prefs.titulos_consulta.slice(0, 3).join(", ")}`
            : ""}
        </p>
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-zinc-700">
        {PORTAIS_BUSCA.map((p) => (
          <label key={p.id} className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={Boolean(portais[p.id])}
              onChange={(e) => setPortais((prev) => ({ ...prev, [p.id]: e.target.checked }))}
            />
            {p.label}
          </label>
        ))}
        <label className="inline-flex items-center gap-1.5 sm:ml-auto">
          <input
            type="checkbox"
            checked={soElegiveis}
            onChange={(e) => setSoElegiveis(e.target.checked)}
          />
          Só ≥ {relatorio?.nota_minima ?? prefs?.nota_minima ?? 4}
        </label>
      </div>

      {message ? (
        <p className={`mb-3 text-sm ${msgErro ? "text-red-600" : "text-zinc-600"}`}>{message}</p>
      ) : null}

      {relatorio?.gerado_em ? (
        <p className="mb-2 text-[12px] tabular-nums text-zinc-500">
          {mostrando === totalLista
            ? `${mostrando} vaga${mostrando === 1 ? "" : "s"}`
            : `Mostrando ${mostrando} de ${totalLista}`}
          {elegiveisVisiveis > 0 ? ` · ${elegiveisVisiveis} ≥ ${notaMin}` : ""}
        </p>
      ) : null}

      {!vagas.length ? (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500">
          Sem resultados
        </p>
      ) : (
        <ul className="space-y-2">
          {vagas.map((v) => {
            const slug = v.segmento_sugerido;
            const tema = temaSegmento(slug);
            const slot = slotDoSegmento(segmentacoes, slug);
            const segLabel = v.segmento_label || (slug ? labelSeg(slug) : null);

            return (
              <li
                key={v.id || v.url}
                className="rounded-xl border border-zinc-200/90 bg-white p-3 shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug text-zinc-900">{v.titulo}</p>
                    <p className="mt-0.5 text-[12px] text-zinc-600">
                      {v.empresa}
                      {v.cidade ? ` · ${v.cidade}` : ""}
                      {v.estado ? `/${v.estado}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-bold tabular-nums ${notaClass(v.nota, v.elegivel)}`}
                    title="Nota"
                  >
                    {Number(v.nota).toFixed(1)}
                  </span>
                </div>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-zinc-400">
                  <span>{labelPortal(v.portal) ?? v.portal}</span>
                  {v.modalidade ? (
                    <>
                      <span aria-hidden>·</span>
                      <span>{LABEL_MODALIDADE[v.modalidade] ?? v.modalidade}</span>
                    </>
                  ) : null}
                  {segLabel ? (
                    <>
                      <span aria-hidden>·</span>
                      <span className={`rounded px-1 py-px font-medium ${tema.badge}`}>
                        {labelSegCurto(slug) || segLabel}
                      </span>
                    </>
                  ) : null}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {v.elegivel ? (
                    <Link
                      href={hrefVaga(v)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      Gerar CV
                    </Link>
                  ) : (
                    <Link
                      href={hrefVaga(v)}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                    >
                      Abrir na Vaga
                    </Link>
                  )}
                  {slot ? (
                    <Link
                      href="/curriculo"
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                    >
                      CV base
                    </Link>
                  ) : null}
                  {v.url ? (
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                    >
                      Ver vaga
                    </a>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
