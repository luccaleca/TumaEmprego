"use client";

import Link from "next/link";
import CvDropZone from "@/components/curriculo/CvDropZone";
import CvRamificacoes from "@/components/curriculo/CvRamificacoes";

export default function CurriculoWorkspace({ initialArquivo, initialSegmentacoes }) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-zinc-50/80 via-white to-zinc-50/40 pb-8">
      <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6">
        <header className="mb-3 shrink-0">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Currículo</h1>
          <p className="text-xs text-zinc-500">
            Principal e versões adaptadas ·{" "}
            <Link href="/conteudo" className="text-emerald-700 hover:underline">
              Banco de conteúdo
            </Link>
          </p>
        </header>

        <section aria-label="Currículo principal" className="shrink-0">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Principal
          </p>
          <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm">
            <CvDropZone initialArquivo={initialArquivo} compact />
          </div>
        </section>

        <div className="my-3 shrink-0 border-t border-zinc-200/80" aria-hidden />

        <CvRamificacoes initialSegmentacoes={initialSegmentacoes} compact />
      </div>
    </div>
  );
}
