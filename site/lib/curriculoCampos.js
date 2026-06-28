export const OPCOES_ENFASE = [
  { value: "dados", label: "Dados" },
  { value: "bi", label: "BI" },
  { value: "dev", label: "Desenvolvimento" },
];

export const OPCOES_STATUS = [
  { value: "inbox", label: "Inbox" },
  { value: "evaluating", label: "Avaliando" },
  { value: "ready", label: "Pronto" },
  { value: "applied", label: "Candidatado" },
  { value: "viewed", label: "Visualizado" },
  { value: "interview", label: "Entrevista" },
  { value: "rejected", label: "Recusado" },
  { value: "offer", label: "Proposta" },
];

export const CAMPOS_VAGA = [
  { key: "empresa", label: "Empresa" },
  { key: "titulo", label: "Título da vaga" },
  { key: "url", label: "Link da vaga", full: true },
  { key: "status", label: "Status", type: "status" },
  { key: "enfase", label: "Ênfase do CV", type: "enfase" },
  { key: "nota", label: "Nota do Agent", type: "nota" },
  { key: "resumo", label: "Resumo adaptado", type: "textarea", full: true },
  { key: "experiencia_destaque", label: "Experiência em destaque", type: "textarea", full: true },
  { key: "projetos_destaque", label: "Projetos em destaque", type: "textarea", full: true },
  { key: "carta", label: "Carta / mensagem", type: "textarea", full: true },
  { key: "jd", label: "Descrição da vaga", type: "textarea", full: true },
];

export function labelStatus(value) {
  return OPCOES_STATUS.find((item) => item.value === value)?.label ?? value;
}

export function labelEnfase(value) {
  return OPCOES_ENFASE.find((item) => item.value === value)?.label ?? value;
}
