"use client";

import { useEffect, useState } from "react";

export const THUMB_WIDTH = 120;
const THUMB_HEIGHT = Math.round(THUMB_WIDTH * 1.414);

function isFile(value) {
  return typeof File !== "undefined" && value instanceof File;
}

export default function CvPdfThumbnail({ src }) {
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
      style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT }}
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
