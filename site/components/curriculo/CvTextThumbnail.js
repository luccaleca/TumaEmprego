"use client";

import { THUMB_WIDTH } from "@/components/curriculo/CvPdfThumbnail";

function snippet(text, max = 400) {
  const clean = String(text ?? "").trim();
  if (!clean) return "";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

export default function CvTextThumbnail({ text }) {
  const preview = snippet(text);
  const height = Math.round(THUMB_WIDTH * 1.414);

  return (
    <div
      className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm"
      style={{ width: THUMB_WIDTH, height }}
    >
      <div className="max-h-full overflow-hidden px-2 py-2">
        <pre className="whitespace-pre-wrap font-sans text-[9px] leading-relaxed text-zinc-600">
          {preview || "…"}
        </pre>
      </div>
    </div>
  );
}
