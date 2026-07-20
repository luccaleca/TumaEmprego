/** Rótulos de portal para selos na UI. */
export const PORTAL_LABELS = {
  solides: "Sólides",
  gupy: "Gupy",
  linkedin: "LinkedIn",
  infojobs: "InfoJobs",
  catho: "Catho",
  bebee: "Bebee",
  trampos: "Trampos",
  kenoby: "Kenoby",
  workday: "Workday",
  greenhouse: "Greenhouse",
  lever: "Lever",
};

export function labelPortal(portalId) {
  if (!portalId) return null;
  return PORTAL_LABELS[portalId] ?? portalId;
}
