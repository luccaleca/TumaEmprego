/** Slugs alinhados com `vaga_senioridade` no Postgres. */
export const OPCOES_SENIORIDADE = [
  "banco-de-talentos",
  "jovem-aprendiz",
  "estagio",
  "trainee",
  "junior",
  "pleno",
  "senior",
  "especialista",
  "staff",
];

export const LABEL_SENIORIDADE = {
  "banco-de-talentos": "Banco de Talentos",
  "jovem-aprendiz": "Jovem Aprendiz",
  estagio: "Estágio",
  trainee: "Trainee",
  junior: "Júnior",
  pleno: "Pleno",
  senior: "Sênior",
  especialista: "Especialista",
  staff: "Staff",
};

export function labelSenioridade(slug) {
  return LABEL_SENIORIDADE[slug] ?? slug ?? "—";
}
