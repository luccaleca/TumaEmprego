/**
 * Estrutura do currículo em login.gupy.io/candidates/curriculum (Gupy candidatos).
 * Fonte: página "Meu currículo" (jul/2026) + ajuda oficial Gupy.
 * UI da conta pode estar em EN; labels abaixo em pt-BR (mercado BR).
 */

export const GUPY_CURRICULO_URL = "https://login.gupy.io/candidates/curriculum";

/** @typedef {{ id: string, label: string, obrigatorio?: boolean, hint?: string, opcoes?: string[] }} CampoGupy */

/** @typedef {{ id: string, titulo: string, url?: string, campos: CampoGupy[], repetivel?: boolean }} SecaoGupy */

/** @typedef {{ id: string, titulo: string, secoes: SecaoGupy[] }} BlocoGupy */

/** @type {BlocoGupy[]} */
export const BLOCOS_GUPY_CURRICULO = [
  {
    id: "experience",
    titulo: "Experiência",
    secoes: [
      {
        id: "academic",
        titulo: "Experiência acadêmica",
        repetivel: true,
        campos: [
          { id: "education-level", label: "Nível de escolaridade", obrigatorio: true },
          { id: "formation", label: "Formação / qualificação acadêmica", obrigatorio: true },
          { id: "conclusion-status", label: "Status", obrigatorio: true },
          { id: "institution", label: "Instituição de ensino", obrigatorio: true },
          { id: "course", label: "Curso", obrigatorio: true },
          { id: "start", label: "Início (mês / ano)", obrigatorio: true },
          { id: "end", label: "Fim (mês / ano)", obrigatorio: true, hint: "Se cursando, previsão de formatura" },
        ],
      },
      {
        id: "professional",
        titulo: "Experiência profissional",
        repetivel: true,
        campos: [
          { id: "company", label: "Empresa", obrigatorio: true },
          { id: "role", label: "Cargo", obrigatorio: true },
          { id: "profissional_inicio", label: "Início (mês / ano)", obrigatorio: true },
          { id: "profissional_fim", label: "Fim (mês / ano)", obrigatorio: true },
        ],
      },
      {
        id: "languages",
        titulo: "Idiomas",
        repetivel: true,
        campos: [
          { id: "languageName", label: "Idioma" },
          { id: "languageLevel", label: "Nível", obrigatorio: true },
        ],
      },
      {
        id: "achievements",
        titulo: "Conquistas ou certificações",
        repetivel: true,
        campos: [
          { id: "title", label: "Título", obrigatorio: true },
          { id: "description", label: "Descrição", obrigatorio: true },
        ],
      },
    ],
  },
  {
    id: "about-you",
    titulo: "Sobre você",
    secoes: [
      {
        id: "personal",
        titulo: "Dados pessoais",
        campos: [
          { id: "birthDate", label: "Data de nascimento", obrigatorio: true },
          { id: "gender", label: "Gênero", obrigatorio: true },
          {
            id: "hasDisabilities",
            label: "Candidatar-se como PCD",
            obrigatorio: true,
            hint: "Se sim: CID e laudo quando pedido",
          },
          { id: "addressBrazil", label: "Mora no Brasil?", obrigatorio: true },
          { id: "addressZipCode", label: "CEP", obrigatorio: true },
          { id: "addressStreet", label: "Endereço", obrigatorio: true },
          { id: "addressState", label: "Estado", obrigatorio: true },
          { id: "addressCity", label: "Cidade", obrigatorio: true },
          { id: "linkedinProfileUrl", label: "URL do LinkedIn" },
          { id: "identityCardNumber", label: "Documento (CPF / ID)", obrigatorio: true },
        ],
      },
    ],
  },
  {
    id: "diversity",
    titulo: "Diversidade",
    secoes: [
      {
        id: "diversity-fields",
        titulo: "Dados de diversidade",
        campos: [
          { id: "stateOfOrigin", label: "Estado de origem" },
          { id: "cityOfOrigin", label: "Cidade de origem" },
          { id: "genderPronoun", label: "Pronome" },
          { id: "genderIdentity", label: "Identidade de gênero" },
          { id: "sexualOrientation", label: "Orientação sexual" },
          { id: "raceColor", label: "Cor ou raça" },
          {
            id: "diversityConsent",
            label: "Consentimento para compartilhar dados de diversidade",
          },
        ],
      },
    ],
  },
  {
    id: "skills",
    titulo: "Habilidades",
    secoes: [
      {
        id: "skills-list",
        titulo: "Skills",
        repetivel: true,
        campos: [
          { id: "skills-search-autocomplete", label: "Habilidade", hint: "Autocomplete + Adicionar" },
        ],
      },
    ],
  },
];

/** Títulos dos blocos principais — UI e catálogo. */
export const ESTRUTURA_SECOES_GUPY = BLOCOS_GUPY_CURRICULO.map((b) => b.titulo);

export function getBlocoGupy(blocoId) {
  return BLOCOS_GUPY_CURRICULO.find((b) => b.id === blocoId) ?? null;
}
