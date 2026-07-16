export const OPCOES_MODO = ["focado", "amplo", "hibrido"];

export const OPCOES_MODALIDADE = ["remoto", "presencial", "hibrido"];

export const LABEL_MODO = {
  focado: "Focado",
  amplo: "Amplo",
  hibrido: "Híbrido",
};

export const HINT_MODO = {
  focado: "",
  amplo: "",
  hibrido: "",
};

export const LABEL_MODALIDADE = {
  remoto: "Remoto",
  presencial: "Presencial",
  hibrido: "Híbrido",
};

export function labelModalidades(slugs) {
  const lista = slugs ?? [];
  if (!lista.length) return "—";
  return lista.map((s) => LABEL_MODALIDADE[s] ?? s).join(", ");
}
