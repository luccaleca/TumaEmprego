"use client";

import CvDropZone from "@/components/curriculo/CvDropZone";
import CvSegmentacoes from "@/components/curriculo/CvSegmentacoes";

export default function CurriculoWorkspace({ initialArquivo, initialSegmentacoes }) {
  return (
    <>
      <section className="mx-auto w-full max-w-lg px-4 pt-6 sm:px-6">
        <h1 className="mb-4 text-center text-lg font-semibold tracking-tight text-zinc-900">
          Currículo
        </h1>
        <CvDropZone initialArquivo={initialArquivo} />
      </section>

      <CvSegmentacoes initialSegmentacoes={initialSegmentacoes} />
    </>
  );
}
