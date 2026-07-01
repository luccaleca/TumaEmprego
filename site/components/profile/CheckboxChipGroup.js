"use client";

import { FormField } from "@/components/profile/FormField";

export default function CheckboxChipGroup({
  label,
  hint,
  options,
  labels,
  value = [],
  onChange,
}) {
  const set = new Set(value);

  function toggle(slug) {
    const next = new Set(set);
    if (next.has(slug)) {
      if (next.size === 1) return;
      next.delete(slug);
    } else {
      next.add(slug);
    }
    onChange([...next]);
  }

  return (
    <FormField label={label} hint={hint} full>
      <div className="flex flex-wrap gap-2">
        {options.map((slug) => {
          const ativo = set.has(slug);
          return (
            <button
              key={slug}
              type="button"
              aria-pressed={ativo}
              onClick={() => toggle(slug)}
              className={[
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                ativo
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-400"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
              ].join(" ")}
            >
              {labels?.[slug] ?? slug}
            </button>
          );
        })}
      </div>
    </FormField>
  );
}
