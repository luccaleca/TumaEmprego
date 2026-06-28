export function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-zinc-900">{children}</dd>
    </div>
  );
}
