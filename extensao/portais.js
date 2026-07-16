/**
 * Detecção de portal por URL na extensão.
 * Manter domínios alinhados com site/lib/portaisCatalogo.js
 */
const PORTAIS_DOMINIOS = [
  { id: "solides", dominios: ["solides.com.br", "profiler.solides.com", "perfil.vagas.solides.com.br", "vagas.solides.com.br"] },
  { id: "gupy", dominios: ["gupy.io", "portal.gupy.io", "gupy.com.br", "login.gupy.io"] },
  { id: "kenoby", dominios: ["kenoby.com", "jobs.kenoby.com"] },
  { id: "workday", dominios: ["myworkdayjobs.com", "wd1.myworkdaysite.com"] },
  { id: "greenhouse", dominios: ["greenhouse.io", "boards.greenhouse.io"] },
  { id: "lever", dominios: ["lever.co", "jobs.lever.co"] },
  { id: "redbull", dominios: ["jobs.redbull.com", "redbull.com"] },
];

const PORTAIS_NOMES = {
  solides: "Sólides",
  gupy: "Gupy",
  kenoby: "Kenoby",
  workday: "Workday",
  greenhouse: "Greenhouse",
  lever: "Lever",
  redbull: "Red Bull",
};

function detectarPortalPorUrl(url) {
  const raw = String(url ?? "").toLowerCase();
  if (!raw) return null;

  for (const portal of PORTAIS_DOMINIOS) {
    if (portal.dominios.some((d) => raw.includes(d))) {
      return portal.id;
    }
  }
  return null;
}

function metaPortalLocal(portalId) {
  if (!portalId) {
    return { portal: null, portal_nome: null, portal_motor_ativo: false };
  }
  const motores = new Set(["solides", "gupy"]);
  return {
    portal: portalId,
    portal_nome: PORTAIS_NOMES[portalId] ?? portalId,
    portal_motor_ativo: motores.has(portalId),
  };
}
