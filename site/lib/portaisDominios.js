/**
 * Domínios para detectar portal pela URL — sem aparecer na UI até ter motor.
 */

/** @type {{ id: string, nome: string, dominios: string[] }[]} */
export const PORTAIS_POR_DOMINIO = [
  {
    id: "solides",
    nome: "Sólides",
    dominios: [
      "solides.com.br",
      "profiler.solides.com",
      "perfil.vagas.solides.com.br",
      "vagas.solides.com.br",
    ],
  },
  {
    id: "gupy",
    nome: "Gupy",
    dominios: ["gupy.io", "portal.gupy.io", "gupy.com.br", "login.gupy.io"],
  },
  { id: "kenoby", nome: "Kenoby", dominios: ["kenoby.com", "jobs.kenoby.com"] },
  {
    id: "workday",
    nome: "Workday",
    dominios: ["myworkdayjobs.com", "wd1.myworkdaysite.com"],
  },
  {
    id: "greenhouse",
    nome: "Greenhouse",
    dominios: ["greenhouse.io", "boards.greenhouse.io"],
  },
  { id: "lever", nome: "Lever", dominios: ["lever.co", "jobs.lever.co"] },
  {
    id: "redbull",
    nome: "Red Bull Jobs",
    dominios: ["jobs.redbull.com", "redbull.com"],
  },
];

export function getPortalDetectado(portalId) {
  return PORTAIS_POR_DOMINIO.find((p) => p.id === portalId) ?? null;
}
