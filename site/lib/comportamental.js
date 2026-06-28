export const RESPOSTAS_CURTAS = [
  { key: "por_que_dados", label: "Por que dados?" },
  { key: "por_que_estagio", label: "Por que estágio?" },
  { key: "maior_qualidade", label: "Maior qualidade" },
  { key: "maior_desenvolvimento", label: "Maior ponto a desenvolver" },
  { key: "projetos_destaque", label: "Projetos em destaque" },
];

export const STAR_FIELDS = [
  { key: "situacao", label: "Situação" },
  { key: "tarefa", label: "Tarefa" },
  { key: "acao", label: "Ação" },
  { key: "resultado", label: "Resultado" },
  { key: "reflexao", label: "Reflexão" },
];

export function formatHistoriaTitle(historia) {
  if (historia.pergunta_exemplo) {
    return historia.pergunta_exemplo.length > 72
      ? `${historia.pergunta_exemplo.slice(0, 72)}…`
      : historia.pergunta_exemplo;
  }
  return historia.id?.replace(/_/g, " ") ?? "História";
}

export function tagsToString(tags) {
  return Array.isArray(tags) ? tags.join(", ") : "";
}

export function stringToTags(value) {
  return String(value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
