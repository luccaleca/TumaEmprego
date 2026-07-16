/**
 * Catálogo de portais com currículo estruturado (formulário próprio, não PDF).
 */

import { ESTRUTURA_SECOES_GUPY } from "./gupyCurriculoEstrutura.js";
import { ESTRUTURA_SECOES_SOLIDES } from "./solidesVagasEstrutura.js";
import { detectarPortalPorUrl as detectarPortal } from "./portaisDetectar.js";
import { getPortalDetectado, PORTAIS_POR_DOMINIO } from "./portaisDominios.js";
import { MOLDE_SOLIDES_VAGAS_ID } from "./solidesVagasMolde.js";

/** @typedef {{ titulo: string, nota?: string }} SecaoPortal */

/**
 * @typedef {{
 *   id: string;
 *   nome: string;
 *   sigla: string;
 *   cor: string;
 *   dominios: string[];
 *   tipo: string;
 *   status: 'ativo' | 'planejado';
 *   motor?: boolean;
 *   secoes: SecaoPortal[];
 * }} PortalCatalogo
 */

/** Portais com estrutura na UI.
 * motor: true = Tuma apoia o portal (Sólides = pacote; Gupy = autofill de estrutura).
 */
export const PORTAIS_ESTRUTURADOS = [
  {
    id: "solides",
    nome: "Sólides",
    sigla: "S",
    cor: "#7c3aed",
    dominios: PORTAIS_POR_DOMINIO.find((p) => p.id === "solides").dominios,
    tipo: "Portal de Vagas",
    status: "ativo",
    motor: true,
    molde: MOLDE_SOLIDES_VAGAS_ID,
    imagem: "/portais/solides-card.png",
    secoes: ESTRUTURA_SECOES_SOLIDES.map((titulo) => ({ titulo })),
  },
  {
    id: "gupy",
    nome: "Gupy",
    sigla: "G",
    cor: "#1e3a5f",
    dominios: PORTAIS_POR_DOMINIO.find((p) => p.id === "gupy").dominios,
    tipo: "Portal de candidatos",
    status: "ativo",
    motor: true,
    imagem: "/portais/gupy-card.png?v=4",
    imagemFundo: "#ffffff",
    secoes: ESTRUTURA_SECOES_GUPY.map((titulo) => ({ titulo })),
  },
];

export function listarPortaisComStatus() {
  return PORTAIS_ESTRUTURADOS;
}

export function getPortalCatalogo(portalId) {
  const ui = PORTAIS_ESTRUTURADOS.find((p) => p.id === portalId);
  if (ui) return ui;

  const det = getPortalDetectado(portalId);
  if (!det) return null;

  return {
    id: det.id,
    nome: det.nome,
    sigla: det.nome.slice(0, 2).toUpperCase(),
    cor: "#71717a",
    dominios: det.dominios,
    tipo: "Portal",
    status: "detectado",
    motor: false,
    secoes: [],
  };
}

export function detectarPortalPorUrl(url) {
  return detectarPortal(url, PORTAIS_POR_DOMINIO);
}

export function resolverPortalVagaInput(input) {
  const explicito = String(input?.portal ?? "").trim();
  if (explicito) {
    return getPortalCatalogo(explicito)?.id ?? explicito;
  }
  return detectarPortalPorUrl(input?.vaga_url);
}

export function portalTemMotorAtivo(portalId) {
  const portal = PORTAIS_ESTRUTURADOS.find((p) => p.id === portalId);
  return Boolean(portal?.status === "ativo" && portal?.motor);
}

export function metaPortalParaResposta(portalId) {
  const portal = portalId ? getPortalCatalogo(portalId) : null;
  if (!portal) {
    return {
      portal: null,
      portal_nome: null,
      portal_status: null,
      portal_motor_ativo: false,
    };
  }
  return {
    portal: portal.id,
    portal_nome: portal.nome,
    portal_status: portal.status,
    portal_motor_ativo: portal.status === "ativo" && portal.motor === true,
  };
}
