/**
 * Estrutura do currículo em perfil.vagas.solides.com.br (Sólides Vagas).
 * Fonte: abas oficiais + artigos de ajuda Solides (campos obrigatórios).
 */

export const SOLIDES_VAGAS_BASE = "https://perfil.vagas.solides.com.br/curriculo";

/** @typedef {{ id: string, label: string, obrigatorio?: boolean, hint?: string }} CampoSolides */

/** @typedef {{ id: string, titulo: string, url: string, campos: CampoSolides[] }} AbaSolidesVagas */

/** @type {AbaSolidesVagas[]} */
export const ABAS_SOLIDES_VAGAS = [
  {
    id: "sobre",
    titulo: "Sobre você",
    url: `${SOLIDES_VAGAS_BASE}?aba=sobre`,
    campos: [
      { id: "nome_completo", label: "Nome completo", obrigatorio: true },
      { id: "email", label: "E-mail", obrigatorio: true },
      { id: "celular", label: "Celular", obrigatorio: true },
      { id: "data_nascimento", label: "Data de nascimento", obrigatorio: true },
      { id: "cpf", label: "CPF", obrigatorio: true },
      { id: "cidade_estado", label: "Cidade / Estado" },
      { id: "apresentacao", label: "Fale sobre você", hint: "Trajetória alinhada à vaga — 3 a 5 linhas" },
      { id: "cargo_interesse", label: "Cargo ou área de interesse" },
    ],
  },
  {
    id: "experiencias",
    titulo: "Suas experiências",
    url: `${SOLIDES_VAGAS_BASE}?aba=experiencias`,
    campos: [
      { id: "resumo_trajetoria", label: "Resumo da trajetória profissional" },
      { id: "experiencia_cargo", label: "Experiência — Cargo", obrigatorio: true },
      { id: "experiencia_empresa", label: "Experiência — Empresa", obrigatorio: true },
      { id: "experiencia_inicio", label: "Experiência — Data de início", obrigatorio: true },
      { id: "experiencia_fim", label: "Experiência — Data de término", obrigatorio: true },
      { id: "experiencia_local", label: "Experiência — Local" },
      { id: "experiencia_atividades", label: "Experiência — Atividades e resultados" },
      { id: "formacao_instituicao", label: "Formação — Instituição", obrigatorio: true },
      { id: "formacao_grau", label: "Formação — Nível do curso", obrigatorio: true },
      { id: "formacao_curso", label: "Formação — Curso", obrigatorio: true },
      { id: "formacao_inicio", label: "Formação — Data de início" },
      { id: "formacao_fim", label: "Formação — Ano de conclusão (ou previsão)", obrigatorio: true },
      { id: "curso_nome", label: "Curso / certificação — Nome do curso", obrigatorio: true },
      { id: "curso_instituicao", label: "Curso / certificação — Instituição", obrigatorio: true },
      { id: "curso_nivel", label: "Curso / certificação — Nível", obrigatorio: true },
      { id: "curso_ano", label: "Curso / certificação — Ano de conclusão", obrigatorio: true },
      { id: "curso_descricao", label: "Curso / certificação — Descrição das atividades" },
    ],
  },
  {
    id: "habilidades",
    titulo: "Suas habilidades",
    url: `${SOLIDES_VAGAS_BASE}?aba=habilidades`,
    campos: [
      { id: "habilidade_nome", label: "Habilidade", obrigatorio: true },
      { id: "habilidade_nivel", label: "Nível (Básico · Intermediário · Avançado)", obrigatorio: true },
      { id: "idioma", label: "Idioma" },
      { id: "idioma_nivel", label: "Proficiência no idioma" },
    ],
  },
  {
    id: "outras-informacoes",
    titulo: "Outras informações",
    url: `${SOLIDES_VAGAS_BASE}?aba=outras-informacoes`,
    campos: [
      {
        id: "campos_empresa",
        label: "Campos exigidos pela empresa",
        hint: "CNH, RG, diversidade, perguntas da vaga — variam por inscrição",
      },
    ],
  },
];

/** Títulos das 4 abas — UI e motor. */
export const ESTRUTURA_SECOES_SOLIDES = ABAS_SOLIDES_VAGAS.map((a) => a.titulo);

export function getAbaSolides(abaId) {
  return ABAS_SOLIDES_VAGAS.find((a) => a.id === abaId) ?? null;
}
