"use client";

import {
  agruparAlvosPorCargo,
  contarCombinacoesBusca,
  listarCurriculosSegmento,
} from "@/lib/alvosSegmento";
import { temaSegmento } from "@/lib/cvSegmentoTema";
import { labelsSenioridades } from "@/lib/preferenciasBusca";

function ResumoSenioridades({ senioridades }) {
  if (!senioridades?.length) return null;

  return (
    <p className="text-xs text-zinc-500">
      Senioridades:{" "}
      <span className="font-medium text-zinc-700">{labelsSenioridades(senioridades)}</span>
    </p>
  );
}

function CargoBuscaRow({ cargo, tema, variant = "foco" }) {
  const isComplemento = variant === "complemento";

  return (
    <li
      className={[
        "rounded-lg border px-3 py-2.5",
        isComplemento
          ? "border-dashed border-amber-200/90 bg-amber-50/40"
          : "border-zinc-200/80 bg-white",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            {isComplemento ? `${cargo.area} · ${cargo.nicho}` : cargo.nicho}
          </p>
          <p className="mt-0.5 text-sm font-medium leading-snug text-zinc-900">{cargo.titulo}</p>
        </div>
        <span
          className={[
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
            isComplemento ? "bg-amber-100 text-amber-900" : tema.badge,
          ].join(" ")}
        >
          {cargo.senioridades.length}{" "}
          {cargo.senioridades.length === 1 ? "busca" : "buscas"}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {cargo.senioridades.map((sen) => (
          <span
            key={sen.slug}
            className={[
              "rounded-md px-2 py-0.5 text-[11px] font-medium",
              isComplemento ? "bg-white text-amber-950 ring-1 ring-amber-200" : tema.badge,
            ].join(" ")}
          >
            {sen.label}
          </span>
        ))}
      </div>
    </li>
  );
}

function SegmentoBuscaCard({ cv, senioridades }) {
  const tema = temaSegmento(cv.slug);
  const foco = agruparAlvosPorCargo(cv.primarios);
  const complemento = agruparAlvosPorCargo(cv.complementares);
  const totalFoco = contarCombinacoesBusca(foco);
  const totalComp = contarCombinacoesBusca(complemento);

  return (
    <article
      className={[
        "overflow-hidden rounded-xl border shadow-sm ring-1",
        tema.card,
        tema.ring,
      ].join(" ")}
    >
      <div className={`px-4 py-3 ${tema.header}`}>
        <h3 className="text-sm font-semibold text-white">{cv.nome}</h3>
        <p className="mt-0.5 text-[11px] text-white/85">
          {foco.length
            ? `${foco.length} ${foco.length === 1 ? "cargo" : "cargos"} · ${totalFoco} ${totalFoco === 1 ? "combinação" : "combinações"} de busca`
            : "CV geral do segmento"}
          {totalComp > 0 ? ` · ${totalComp} complemento${totalComp === 1 ? "" : "s"}` : ""}
        </p>
      </div>

      <div className="space-y-4 p-4">
        {foco.length ? (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Foco — o buscador prioriza
            </p>
            <ul className="space-y-2" role="list">
              {foco.map((cargo) => (
                <CargoBuscaRow key={cargo.chave} cargo={cargo} tema={tema} variant="foco" />
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">
            Sem cargo específico marcado — a busca usa o segmento inteiro como referência.
          </p>
        )}

        {complemento.length ? (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Complemento — aparece com menor peso
            </p>
            <ul className="space-y-2" role="list">
              {complemento.map((cargo) => (
                <CargoBuscaRow
                  key={`${cv.slug}-${cargo.chave}`}
                  cargo={cargo}
                  tema={tema}
                  variant="complemento"
                />
              ))}
            </ul>
          </div>
        ) : null}

        <ResumoSenioridades senioridades={senioridades} />
      </div>
    </article>
  );
}

export default function BuscaAlvosResumo({ catalogo, busca, compact = false }) {
  const curriculos = listarCurriculosSegmento(catalogo, busca);
  const senioridades = busca?.senioridades ?? [];

  if (compact) {
    const total = curriculos.reduce(
      (acc, c) =>
        acc +
        contarCombinacoesBusca(agruparAlvosPorCargo(c.primarios)) +
        contarCombinacoesBusca(agruparAlvosPorCargo(c.complementares)),
      0,
    );
    return (
      <p className="text-xs text-zinc-500">
        <span className="font-medium text-zinc-700">{curriculos.length}</span> segmento(s)
        {total > 0 ? (
          <>
            {" · "}
            <span className="font-medium text-zinc-700">{total}</span> buscas
          </>
        ) : null}
      </p>
    );
  }

  if (!curriculos.length) {
    return (
      <section className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-center">
        <p className="text-sm text-zinc-600">Marque um segmento para ver a prévia da busca.</p>
      </section>
    );
  }

  const totalCombinacoes = curriculos.reduce(
    (acc, c) =>
      acc +
      contarCombinacoesBusca(agruparAlvosPorCargo(c.primarios)) +
      contarCombinacoesBusca(agruparAlvosPorCargo(c.complementares)),
    0,
  );

  return (
    <section className="space-y-3" aria-labelledby="busca-previa-heading">
      <div>
        <h2 id="busca-previa-heading" className="text-sm font-semibold text-zinc-900">
          Prévia da busca
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Cada cargo se multiplica pelas senioridades ativas —{" "}
          <span className="font-medium text-zinc-700">
            {totalCombinacoes} {totalCombinacoes === 1 ? "combinação" : "combinações"} no total
          </span>
          .
        </p>
      </div>

      <div className="space-y-3">
        {curriculos.map((cv) => (
          <SegmentoBuscaCard key={cv.slug} cv={cv} senioridades={senioridades} />
        ))}
      </div>
    </section>
  );
}
