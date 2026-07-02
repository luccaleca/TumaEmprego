"use client";

import { listarCurriculosSegmento } from "@/lib/alvosSegmento";

export default function BuscaAlvosResumo({ catalogo, busca, compact = false }) {
  const curriculos = listarCurriculosSegmento(catalogo, busca);

  if (compact) {
    const total = curriculos.reduce(
      (acc, c) => acc + c.primarios.length + c.complementares.length,
      0,
    );
    return (
      <p className="text-xs text-zinc-500">
        <span className="font-medium text-zinc-700">{curriculos.length}</span> CV(s)
        {total > 0 ? (
          <>
            {" · "}
            <span className="font-medium text-zinc-700">{total}</span> alvos
          </>
        ) : null}
      </p>
    );
  }

  if (!curriculos.length) {
    return (
      <section className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-center">
        <p className="text-sm text-zinc-600">Marque um segmento para gerar currículo.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-zinc-900">Currículos por segmento</h2>
      {curriculos.map((cv) => (
        <article key={cv.slug} className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
          <h3 className="mb-3 text-sm font-semibold text-emerald-900">{cv.nome}</h3>

          {cv.primarios.length ? (
            <div className="mb-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Foco
              </p>
              <ul className="space-y-1.5" role="list">
                {cv.primarios.map((item) => (
                  <li
                    key={item.chaveComposta}
                    className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-950"
                  >
                    <span className="font-medium">{item.senioridadeLabel}</span>
                    <span className="text-emerald-700/70"> · </span>
                    <span>{item.titulo}</span>
                    <span className="mt-0.5 block text-[11px] text-emerald-800/70">
                      {item.nicho}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mb-3 text-xs text-zinc-500">CV geral do segmento (sem cargo específico).</p>
          )}

          {cv.complementares.length ? (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Complemento
              </p>
              <ul className="space-y-1.5" role="list">
                {cv.complementares.map((item) => (
                  <li
                    key={`${cv.slug}-${item.chaveComposta}`}
                    className="rounded-lg border border-dashed border-amber-200 bg-amber-50/60 px-3 py-2 text-sm text-amber-950"
                  >
                    <span className="font-medium">{item.senioridadeLabel}</span>
                    <span className="text-amber-700/70"> · </span>
                    <span>{item.titulo}</span>
                    <span className="mt-0.5 block text-[11px] text-amber-800/70">
                      {item.area} → {item.nicho}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}
