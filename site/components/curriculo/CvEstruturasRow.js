"use client";

import PortalIcon from "@/components/portais/PortalIcon";

const CARD =
  "flex h-[88px] w-[112px] shrink-0 flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition";

function CvBaseMoldeCard({ onAbrir }) {
  return (
    <article className={`${CARD} border-emerald-200/90 hover:border-emerald-400 hover:shadow-md`}>
      <button
        type="button"
        onClick={onAbrir}
        className="flex h-full w-full flex-col text-left"
        title="Estrutura base"
      >
        <div className="flex flex-1 items-center justify-center bg-emerald-50/80 px-2">
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-800">
            ATS
          </span>
        </div>
        <div className="border-t border-zinc-100 px-2 py-1.5">
          <p className="truncate text-[11px] font-semibold text-zinc-900">Base</p>
        </div>
      </button>
    </article>
  );
}

function PortalMoldeCard({ portal, onAbrir }) {
  const comImagem = Boolean(portal.imagem);
  const fundoPersonalizado = Boolean(portal.imagemFundo);
  const fundoEscuro = fundoPersonalizado && portal.imagemFundo !== "#ffffff";

  return (
    <article
      className={`${CARD} ${
        fundoEscuro
          ? "border-zinc-800 hover:border-zinc-600"
          : "border-violet-200/90 hover:border-violet-400"
      } hover:shadow-md`}
    >
      <button
        type="button"
        onClick={() => onAbrir(portal)}
        className="flex h-full w-full flex-col text-left"
        title={portal.nome}
      >
        <div
          className={`flex min-h-0 flex-1 items-center justify-center overflow-hidden ${
            fundoEscuro ? "!bg-black" : fundoPersonalizado ? "!bg-white" : "bg-violet-50/50"
          }`}
        >
          {comImagem ? (
            <img
              src={portal.imagem}
              alt=""
              className={
                fundoPersonalizado
                  ? "h-full w-full object-contain px-2 py-1.5"
                  : "h-full w-full object-cover"
              }
            />
          ) : (
            <PortalIcon nome={portal.nome} sigla={portal.sigla} cor={portal.cor} size="sm" />
          )}
        </div>
        <div className="border-t border-zinc-100 bg-white px-2 py-1.5">
          <p className="truncate text-[11px] font-semibold text-zinc-900">{portal.nome}</p>
        </div>
      </button>
    </article>
  );
}

export default function CvEstruturasRow({ portais = [], onAbrirBase, onAbrirPortal }) {
  const moldes = portais.filter((p) => p.status === "ativo");

  return (
    <div>
      <ul className="flex items-stretch gap-2 overflow-x-auto pb-0.5" role="list">
        <li className="shrink-0">
          <CvBaseMoldeCard onAbrir={onAbrirBase} />
        </li>
        {moldes.map((portal) => (
          <li key={portal.id} className="shrink-0">
            <PortalMoldeCard portal={portal} onAbrir={onAbrirPortal} />
          </li>
        ))}
      </ul>
    </div>
  );
}
