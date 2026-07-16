export default function PortalIcon({ nome, sigla, cor, size = "md" }) {
  const dim = size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-sm ${dim}`}
      style={{ backgroundColor: cor }}
      title={nome}
      aria-hidden
    >
      {sigla}
    </div>
  );
}
