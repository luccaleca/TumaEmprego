"use client";

import { expandirAlvosCandidatura } from "@/lib/preferenciasBusca";

export default function BuscaAlvosResumo({ preferencias, alvos, compact = false }) {
  const expandidos = expandirAlvosCandidatura(alvos, preferencias?.senioridades);

  if (compact) {
    return (
      <p className="text-xs text-zinc-500">
        <span className="font-medium text-zinc-700">{expandidos.length}</span> alvos
      </p>
    );
  }

  if (!alvos?.length) {
    return (
      <section className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-center">
        <p className="text-sm text-zinc-600">Nenhum cargo selecionado.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">Alvos</h2>
      <ul className="space-y-1.5" role="list">
        {expandidos.map((item) => (
          <li
            key={item.chaveComposta}
            className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-950"
          >
            <span className="font-medium">{item.senioridadeLabel}</span>
            <span className="text-emerald-700/70"> · </span>
            <span>{item.titulo}</span>
            <span className="mt-0.5 block text-[11px] text-emerald-800/70">
              {item.area} → {item.nicho}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
