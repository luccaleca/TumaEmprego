/**
 * Portais usados pelo motor de busca de vagas.
 */

import { consultasGupyDeBusca, listarGupy } from "./portais/gupyListagem.js";
import { consultasSolidesDeBusca, listarSolides } from "./portais/solidesListagem.js";
import {
  consultasBebeeDeBusca,
  listarBebee,
  localBebeeDePerfil,
  tituloBebeeBateConsulta,
} from "./portais/bebeeListagem.js";
import { consultasTramposDeBusca, listarTrampos } from "./portais/tramposListagem.js";
import { estadoParaConsultaGupy } from "./localizacaoBusca.js";

/** @typedef {{ id: string, label: string, default: boolean, consultas: Function, buscar: Function }} PortalBusca */

/** @type {PortalBusca[]} */
export const PORTAIS_BUSCA = [
  {
    id: "gupy",
    label: "Gupy",
    default: true,
    consultas: consultasGupyDeBusca,
    buscar: async (consulta, ctx) => {
      const lista = await listarGupy(consulta, {
        limit: ctx.maxPorConsulta,
        maxPaginas: 1,
        modalidades: ctx.modalidades,
        estado: ctx.estadoGupy,
      });
      return { vagas: lista, aviso: null };
    },
  },
  {
    id: "solides",
    label: "Sólides",
    default: true,
    consultas: consultasSolidesDeBusca,
    buscar: async (consulta, ctx) =>
      listarSolides(consulta, {
        take: ctx.maxPorConsulta,
        maxPaginas: 1,
        modalidades: ctx.modalidades,
      }),
  },
  {
    id: "bebee",
    label: "Bebee",
    default: true,
    consultas: consultasBebeeDeBusca,
    buscar: async (consulta, ctx) => {
      const r = await listarBebee(consulta, {
        limit: ctx.maxPorConsulta,
        maxPaginas: 1,
        modalidades: ctx.modalidades,
        local: ctx.localBebee,
      });
      const vagas = (r.vagas ?? []).filter((v) => tituloBebeeBateConsulta(v, consulta));
      return { vagas, aviso: r.aviso };
    },
  },
  {
    id: "trampos",
    label: "Trampos",
    default: true,
    consultas: consultasTramposDeBusca,
    buscar: async (consulta, ctx) => ({
      vagas: await listarTrampos(consulta, { maxPaginas: 2 }),
      aviso: null,
    }),
  },
];

export const PORTAIS_BUSCA_IDS = PORTAIS_BUSCA.map((p) => p.id);

export function portaisBuscaDefault() {
  return Object.fromEntries(PORTAIS_BUSCA.map((p) => [p.id, p.default]));
}

export function getPortalBusca(id) {
  return PORTAIS_BUSCA.find((p) => p.id === id) ?? null;
}

export function labelPortalBusca(id) {
  return getPortalBusca(id)?.label ?? id;
}

export function montarContextoBusca({ busca, profile, maxPorConsulta }) {
  return {
    maxPorConsulta,
    modalidades: busca.modalidades_trabalho ?? [],
    estadoGupy: estadoParaConsultaGupy(profile),
    localBebee: localBebeeDePerfil(profile),
  };
}

/** @param {string[]} portaisIds */
export async function coletarVagasPortais(portaisIds, ctx, titulos, senioridades) {
  const brutas = [];
  const avisos = [];
  const erros = [];
  const consultas = [];

  for (const portalId of portaisIds) {
    const portal = getPortalBusca(portalId);
    if (!portal) continue;

    const qs = portal.consultas(titulos, senioridades);
    for (const q of qs) {
      consultas.push(`${portalId}:${q}`);
      try {
        const r = await portal.buscar(q, ctx);
        if (r.aviso) avisos.push(r.aviso);
        for (const v of r.vagas ?? []) {
          brutas.push({ ...v, consulta: q });
        }
      } catch (err) {
        erros.push(`${portal.label} (${q}): ${err.message || err}`);
      }
    }
  }

  return { brutas, avisos, erros, consultas: [...new Set(consultas)] };
}
