"use client";

import { getThumbSize } from "@/components/curriculo/CvPdfThumbnail";

function snippet(text, max = 400) {
  const clean = String(text ?? "").trim();
  if (!clean) return "";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

export default function CvTextThumbnail({ text, compact = false }) {
  const preview = snippet(text);
  const { width, height } = getThumbSize(compact);

  return (
    <div
      className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm"
      style={{ width, height }}
    >
      <div className="max-h-full overflow-hidden px-2 py-2">
        <pre className="whitespace-pre-wrap font-sans text-[9px] leading-relaxed text-zinc-600">
          {preview || "…"}
        </pre>
      </div>
    </div>
  );
}
