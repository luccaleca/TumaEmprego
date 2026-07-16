export const OPCOES_SIM_NAO = ["Não", "Sim"];

export const OPCOES_NIVEL = ["Básico", "Intermediário", "Avançado"];

export const CAMPOS_CANDIDATURA = [
  { key: "pretensao_salarial", label: "Pretensão salarial", type: "money" },
  { key: "ingles", label: "Inglês", type: "nivel" },
  { key: "espanhol", label: "Espanhol", type: "nivel" },
  { key: "excel", label: "Excel", type: "nivel" },
  { key: "remoto", label: "Modelo de trabalho", type: "text" },
  { key: "como_conheceu", label: "Como / onde encontrou a vaga", type: "text" },
  { key: "trabalha_atualmente", label: "Trabalha atualmente?", type: "sim_nao" },
  { key: "indicacao_parente", label: "Indicação ou parente na empresa", type: "sim_nao" },
  { key: "aceita_viagem", label: "Aceita viagem", type: "sim_nao" },
];

export function formatPretensaoSalarial(value) {
  if (value === "" || value === null || value === undefined) return null;
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `R$ ${amount.toLocaleString("pt-BR")}/mês`;
}

export function displayCandidaturaValue(campo, value) {
  if (campo.type === "money") return formatPretensaoSalarial(value);
  return value;
}
