"use client";

import { useState } from "react";
import CvDropZone from "@/components/curriculo/CvDropZone";
import CvPrincipalEditor from "@/components/curriculo/CvPrincipalEditor";

export default function CurriculoWorkspace({
  initialContent,
  initialSections,
  initialArquivo,
}) {
  const [content, setContent] = useState(initialContent);
  const [sections, setSections] = useState(initialSections);
  const [editorKey, setEditorKey] = useState(0);

  function handleUploaded(data) {
    if (data.type === "markdown" && data.content) {
      setContent(data.content);
      setSections(data.sections ?? []);
      setEditorKey((k) => k + 1);
    }
  }

  return (
    <>
      <section className="mx-auto w-full max-w-lg px-4 pt-6 sm:px-6">
        <h1 className="mb-4 text-center text-lg font-semibold tracking-tight text-zinc-900">
          Currículo
        </h1>

        <CvDropZone
          initialArquivo={initialArquivo}
          initialPreviewText={initialContent}
          onUploaded={handleUploaded}
        />
      </section>

      <section className="mx-auto mt-6 w-full max-w-3xl px-4 pb-8 sm:px-6">
        <CvPrincipalEditor
          key={editorKey}
          initialContent={content}
          initialSections={sections}
        />
      </section>
    </>
  );
}
