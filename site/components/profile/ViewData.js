import { Children } from "react";
import { labelArea } from "@/lib/format";

export function EmptyValue() {
  return <span className="text-sm italic text-zinc-400">Não informado</span>;
}

export function DataList({ children }) {
  const items = Children.toArray(children).filter(Boolean);

  if (!items.length) return null;

  return (
    <dl className="divide-y divide-zinc-200/80 overflow-hidden rounded-lg border border-zinc-200/80 bg-zinc-50/50">
      {items}
    </dl>
  );
}

export function DataRow({ label, children, highlight = false, hideIfEmpty = false }) {
  const isEmpty =
    children === null ||
    children === undefined ||
    children === "" ||
    children === "—" ||
    (typeof children === "string" && !children.trim());

  if (hideIfEmpty && isEmpty) return null;

  return (
    <div
      className={`grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4 sm:py-3.5 ${
        highlight ? "bg-white/70" : ""
      }`}
    >
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="min-w-0 text-sm leading-relaxed text-zinc-800">
        {isEmpty ? <EmptyValue /> : children}
      </dd>
    </div>
  );
}

export function DataBadge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-zinc-200/70 text-zinc-700",
    brand: "bg-emerald-100 text-emerald-800",
    dark: "bg-slate-800 text-white",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function DataTags({ items, tone = "brand" }) {
  if (!items?.length) return <EmptyValue />;

  const tones = {
    brand: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100",
    neutral: "bg-white text-zinc-700 ring-1 ring-zinc-200",
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
        >
          {labelArea(item)}
        </span>
      ))}
    </div>
  );
}

export function DataText({ children }) {
  if (!children || children === "—") return <EmptyValue />;

  return (
    <p className="rounded-lg border border-zinc-200/80 bg-white px-4 py-3 text-sm leading-7 text-zinc-700">
      {children}
    </p>
  );
}

export function DataLink({ href, label, external = true }) {
  if (!href) return <EmptyValue />;

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="inline-flex max-w-full items-center gap-1.5 rounded-md text-sm font-medium text-emerald-700 transition hover:text-emerald-900 hover:underline"
    >
      <span className="truncate">{label || href}</span>
      {external ? (
        <span aria-hidden className="shrink-0 text-xs text-emerald-500">
          ↗
        </span>
      ) : null}
    </a>
  );
}

export function DataLinks({ links }) {
  const visible = links.filter((link) => link.href);
  if (!visible.length) return <EmptyValue />;

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
        >
          {link.label}
          <span aria-hidden className="text-zinc-400">
            ↗
          </span>
        </a>
      ))}
    </div>
  );
}

export function splitTags(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
