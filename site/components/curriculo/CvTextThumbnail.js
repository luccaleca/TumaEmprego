"use client";

import { getThumbSize } from "@/components/curriculo/CvPdfThumbnail";

function snippet(text, max = 400) {
  const clean = String(text ?? "").trim();
  if (!clean) return "";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

export default function CvTextThumbnail({ text, compact = false, fullWidth = false, variant }) {
  const sizeVariant = variant ?? (compact ? "compact" : "default");
  const preview = snippet(
    text,
    fullWidth
      ? 600
      : sizeVariant === "audienceCard"
        ? 260
        : sizeVariant === "audience"
          ? 320
          : sizeVariant === "stage"
            ? 500
            : 400,
  );
  const { width, height } = getThumbSize(fullWidth ? "default" : sizeVariant);
  const fontSize =
    sizeVariant === "audienceCard"
      ? "text-[8px] leading-[1.35]"
      : sizeVariant === "audienceTile"
        ? "text-[6px] leading-[1.25]"
        : sizeVariant === "audience"
          ? "text-[7px] leading-[1.35] sm:text-[8px]"
          : sizeVariant === "stage"
            ? "text-[9px] leading-[1.35] sm:text-[10px]"
            : "text-[8px] leading-[1.35] sm:text-[9px]";

  return (
    <div
      className={[
        "overflow-hidden rounded-lg border border-zinc-200/90 bg-gradient-to-b from-white to-zinc-50/80 shadow-inner",
        fullWidth ? "w-full" : "shrink-0",
      ].join(" ")}
      style={fullWidth ? { aspectRatio: "1 / 1.414" } : { width, height }}
    >
      <div className="h-full max-h-full overflow-hidden px-2 py-1.5">
        <pre className={`whitespace-pre-wrap font-sans text-zinc-600 ${fontSize}`}>
          {preview || "…"}
        </pre>
      </div>
    </div>
  );
}
