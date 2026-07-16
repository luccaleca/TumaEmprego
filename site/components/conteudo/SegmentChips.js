"use client";

export function SegmentChips({ value, onChange, label, hint, segmentos = [] }) {
  const selected = new Set(value ?? []);

  function toggle(slug) {
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    onChange([...next]);
  }

  if (!segmentos.length) {
    return (
      <p className="text-xs italic text-zinc-400">Nenhuma área ativa</p>
    );
  }

  return (
    <div>
      {label ? (
        <p className="mb-1.5 text-xs font-medium text-zinc-600">
          {label}
          {hint ? <span className="ml-1 font-normal text-zinc-400">— {hint}</span> : null}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {segmentos.map((seg) => {
          const on = selected.has(seg.slug);
          return (
            <button
              key={seg.slug}
              type="button"
              onClick={() => toggle(seg.slug)}
              className={
                on
                  ? "rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white"
                  : "rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-200"
              }
            >
              {seg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SegmentPicker({ value, onChange, label = "Prévia para", segmentos = [] }) {
  if (!segmentos.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      <div className="flex flex-wrap gap-1">
        {segmentos.map((seg) => (
          <button
            key={seg.slug}
            type="button"
            onClick={() => onChange(seg.slug)}
            className={
              value === seg.slug
                ? "rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-medium text-white"
                : "rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
            }
          >
            {seg.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SegmentTabs({ value, onChange, segmentos = [], prefix = "" }) {
  if (!segmentos.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {segmentos.map((seg) => (
        <button
          key={seg.slug}
          type="button"
          onClick={() => onChange(seg.slug)}
          className={
            value === seg.slug
              ? "rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-white"
              : "rounded-lg bg-white px-2.5 py-1 text-xs text-zinc-600 ring-1 ring-zinc-200"
          }
        >
          {prefix}
          {seg.label}
        </button>
      ))}
    </div>
  );
}

export function SegmentEditTabs({ value, onChange, segmentos = [] }) {
  if (!segmentos.length) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {segmentos.map((seg) => (
        <button
          key={seg.slug}
          type="button"
          onClick={() => onChange(seg.slug)}
          className={
            value === seg.slug
              ? "rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white"
              : "rounded-lg px-2.5 py-1 text-xs text-zinc-600 ring-1 ring-zinc-200"
          }
        >
          {seg.label}
        </button>
      ))}
    </div>
  );
}
