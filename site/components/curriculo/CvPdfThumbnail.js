"use client";

import { useEffect, useState } from "react";

export const THUMB_WIDTH = 120;
export const THUMB_COMPACT_WIDTH = 72;
export const THUMB_AUDIENCE_WIDTH = 100;
export const THUMB_STAGE_WIDTH = 156;

export function getThumbSize(variant = "default") {
  if (variant === "audienceCard") {
    return { width: 104, height: 96 };
  }
  if (variant === "audienceTile") {
    return { width: 58, height: 72 };
  }
  if (variant === "audience") {
    const width = THUMB_AUDIENCE_WIDTH;
    return { width, height: Math.round(width * 0.72) };
  }
  if (variant === "stage") {
    const width = THUMB_STAGE_WIDTH;
    return { width, height: Math.round(width * 1.414) };
  }
  const compact = variant === "compact";
  const width = compact ? THUMB_COMPACT_WIDTH : THUMB_WIDTH;
  return { width, height: Math.round(width * 1.414) };
}

function isFile(value) {
  return typeof File !== "undefined" && value instanceof File;
}

export default function CvPdfThumbnail({ src, compact = false, variant }) {
  const sizeVariant = variant ?? (compact ? "compact" : "default");
  const { width, height } = getThumbSize(sizeVariant);
  const [thumbUrl, setThumbUrl] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!src) return;

    let cancelled = false;
    let objectUrl = null;

    async function load() {
      setStatus("loading");
      setThumbUrl(null);

      try {
        if (typeof src === "string") {
          const res = await fetch(src);
          if (!res.ok || !res.headers.get("content-type")?.includes("image/")) {
            throw new Error("preview failed");
          }

          const blob = await res.blob();
          objectUrl = URL.createObjectURL(blob);

          if (!cancelled) {
            setThumbUrl(objectUrl);
            setStatus("ready");
          }
          return;
        }

        if (isFile(src)) {
          const body = new FormData();
          body.append("file", src);

          const res = await fetch("/api/curriculo/thumbnail", { method: "POST", body });
          if (!res.ok) throw new Error("preview failed");

          const blob = await res.blob();
          objectUrl = URL.createObjectURL(blob);

          if (!cancelled) {
            setThumbUrl(objectUrl);
            setStatus("ready");
          }
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm"
      style={{ width, height }}
    >
      {status === "loading" ? (
        <div className="absolute inset-0 animate-pulse bg-zinc-100" />
      ) : null}

      {thumbUrl && status === "ready" ? (
        <img
          src={thumbUrl}
          alt="Prévia do currículo"
          className="block h-full w-full object-cover object-top"
          onError={() => setStatus("error")}
        />
      ) : null}

      {status === "error" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-zinc-50 px-2 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            PDF
          </span>
          <span className="text-[9px] leading-tight text-zinc-400">sem prévia</span>
        </div>
      ) : null}
    </div>
  );
}
