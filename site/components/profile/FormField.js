export function FormField({
  label,
  hint,
  children,
  className = "",
  full = false,
}) {
  return (
    <label
      className={`block ${full ? "sm:col-span-2" : ""} ${className}`}
    >
      <span className="mb-0.5 block text-[11px] font-medium text-zinc-500">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-0.5 block text-[11px] text-zinc-400">{hint}</span>
      ) : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30";

export const selectClass = inputClass;

export const textareaClass =
  "w-full resize-y rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-sm leading-relaxed text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30";

export function FormSection({
  title,
  description,
  children,
  defaultOpen = true,
  collapsible = false,
}) {
  if (!collapsible) {
    return (
      <section className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-3 py-2">
          <h2 className="text-xs font-semibold text-zinc-800">{title}</h2>
          {description ? (
            <p className="text-[11px] text-zinc-500">{description}</p>
          ) : null}
        </div>
        <div className="p-3">{children}</div>
      </section>
    );
  }

  return (
    <details
      className="group rounded-lg border border-zinc-200 bg-white"
      defaultOpen={defaultOpen}
    >
      <summary className="cursor-pointer list-none border-b border-zinc-100 px-3 py-2 marker:content-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold text-zinc-800">{title}</h2>
            {description ? (
              <p className="text-[11px] text-zinc-500">{description}</p>
            ) : null}
          </div>
          <span className="text-[10px] text-zinc-400 group-open:rotate-180 transition">
            ▼
          </span>
        </div>
      </summary>
      <div className="p-3">{children}</div>
    </details>
  );
}
