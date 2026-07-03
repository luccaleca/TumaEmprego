"use client";

import Link from "next/link";
import { slugParaLabel } from "@/lib/conteudoConstants";
import {
  formatarPreviewMarkdown,
  montarPreviewExperienciasSecao,
} from "@/lib/conteudoPreview";

export default function CvExperienciaPreview({ experiencias, segmentoSlug }) {
  const blocos = montarPreviewExperienciasSecao(experiencias, segmentoSlug);
  const markdown = formatarPreviewMarkdown(blocos);

  return (
    <section className="overflow-hidden rounded-xl border border-emerald-200/80 bg-emerald-50/30">
      <div className="flex items-center justify-between gap-2 border-b border-emerald-200/60 px-3 py-2">
        <p className="text-xs font-medium text-emerald-900">
          No currículo · {slugParaLabel(segmentoSlug)}
        </p>
        <Link href="/curriculo" className="text-[11px] text-emerald-700 hover:underline">
          Gerar versão completa →
        </Link>
      </div>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap px-3 py-3 font-sans text-sm leading-relaxed text-zinc-800">
        {markdown}
      </pre>
    </section>
  );
}
