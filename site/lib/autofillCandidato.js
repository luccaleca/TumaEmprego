/**
 * Mapa de valores para autofill de formulários (extensão).
 * Fonte: profile, formacao, respostas/padrao, busca, estrutura Gupy.
 * Em portal Gupy, os campos do molde Tuma têm prioridade (fonte da verdade).
 */

import { getBusca, getFormacao, getProfile, getRespostasPadrao } from "./dados.js";
import { LABELS_SEGMENTO } from "./conteudoConstants.js";
import { buildDescricaoParaVaga } from "./descricaoVaga.js";
import { resolverPerfilSlug } from "./perfilCvSegmento.js";
import { montarValoresEstruturaPortal } from "./portaisValores.js";

function labelArea(slug) {
  const key = resolverPerfilSlug(slug);
  return LABELS_SEGMENTO[key] ?? LABELS_SEGMENTO[slug] ?? slug;
}

function campo(id, padroes, valor, extra = {}) {
  return {
    id,
    padroes,
    valor: valor == null ? "" : String(valor).trim(),
    ...extra,
  };
}

function camposBase({
  profile,
  formacao,
  respostas,
  area1,
  area2,
  disponibilidade30h,
  como,
  excel,
  descricaoVaga = "",
}) {
  return [
    campo("telefone", ["telefone", "phone", "celular", "whatsapp", "número de telefone", "mobile"], profile.telefone || profile.whatsapp),
    campo("email", ["e-mail", "email", "endereço de e-mail"], profile.email),
    campo("nome", ["nome completo", "full name", "seu nome"], profile.nome),
    campo("nascimento", ["data de nascimento", "date of birth", "birth"], profile.data_nascimento),
    campo("cidade", ["cidade", "city"], profile.cidade || formacao.cidade_campus),
    campo("estado", ["estado você reside", "estado em que reside", "state *", "estado *", "uf", "state"], profile.estado || formacao.estado_campus),
    campo("cep", ["cep", "zip code", "zipcode", "postal"], profile.cep),
    campo("endereco", ["endereço", "address *", "logradouro", "street"], [profile.logradouro, profile.numero].filter(Boolean).join(", ")),
    campo("curso", ["qual curso", "curso você", "curso que", "graduação", "course name", "curso"], formacao.curso),
    campo("instituicao", ["instituição", "faculdade", "universidade", "escola", "educational institution", "institution"], formacao.instituicao),
    campo("formatura", ["data prevista", "terminar sua formação", "previsão de formatura", "previsao de formatura", "formatura", "end *"], formacao.previsao_formatura),
    campo("inicio_formacao", ["início *", "start *", "periodo_inicio"], formacao.periodo_inicio),
    campo("turno", ["período você estuda", "periodo voce estuda", "turno", "período", "periodo"], formacao.turno),
    campo("excel", ["nível em excel", "nivel em excel", "excel"], excel),
    campo("ingles", ["inglês", "ingles", "english", "proficiência em inglês"], respostas.ingles),
    campo("disponibilidade_30h", ["30 horas", "30h", "seis horas", "6 horas", "disponibilidade para estagiar", "cumprindo 6 horas"], disponibilidade30h),
    campo("como_soube", ["como você soube", "como soube do programa", "como conheceu", "onde você encontrou", "onde encontrou essa vaga", "onde encontrou a vaga", "how did you find", "source"], como),
    campo("trabalha_empresa", ["trabalha nessa empresa", "já é colaborador", "work at this company"], respostas.trabalha_atualmente || "Não"),
    campo("indicacao", ["foi indicado", "indicação", "referred"], respostas.indicacao_parente || "Não"),
    campo("area_1", ["principal opção", "primeira opção", "1ª opção", "uma área para estagiar", "sua principal opção"], area1),
    campo("area_2", ["segunda opção", "2ª opção", "segunda opcao", "outra área"], area2),
    campo("linkedin", ["linkedin", "profile url", "your profile url"], profile.linkedin),
    campo("cpf", ["cpf", "your id", "documento", "identity"], profile.cpf),
    campo("pcd", ["pessoa com defici", "disabilit", "pcd"], profile.pcd || "Não"),
    campo("genero", ["gênero", "gender"], profile.sexo),
    campo(
      "descricao_vaga",
      [
        "deseja saber mais sobre você",
        "fale sobre você",
        "trajetória profissional",
        "como pode ajudar",
        "desafio descrito",
        "conte sobre você",
        "apresentação",
        "motivação",
        "por que se candidat",
        "tell us about",
        "about yourself",
        "additional information",
      ],
      descricaoVaga,
    ),
  ];
}

/** Campos do molde Gupy no Tuma — fonte da verdade na página Gupy. */
function idiomaEnNome(nome) {
  const n = String(nome ?? "").toLowerCase();
  if (/portugu/.test(n)) return "Portuguese";
  if (/ingl|english/.test(n)) return "English";
  if (/espanhol|spanish/.test(n)) return "Spanish";
  return nome;
}

function camposIdiomasGupy(idiomas) {
  const lista = Array.isArray(idiomas) ? idiomas : [];
  return lista.flatMap((item, i) => {
    const nome = item.idioma || "";
    const nivel = item.nivel_en || item.nivel || "";
    const nomeEn = idiomaEnNome(nome);
    return [
      campo(`gupy_language_${i}`, ["language", "idioma"], nomeEn || nome, {
        tipo: "combobox",
        prioridade: 1,
        matchIds: [`languageName-${i}`, "languageName", "language-name", "language"],
        aliases: [nome, nomeEn].filter(Boolean),
      }),
      campo(`gupy_language_level_${i}`, ["language level", "nível do idioma", "level *"], nivel, {
        tipo: "combobox",
        prioridade: 1,
        matchIds: [`languageLevel-${i}`, "languageLevel", "language-level"],
        aliases: [item.nivel, item.nivel_en, nivel].filter(Boolean),
      }),
    ];
  });
}

function camposGupy(gupy) {
  const skills = Array.isArray(gupy.skills) ? gupy.skills : [];
  const idiomas = Array.isArray(gupy.idiomas) ? gupy.idiomas : [];

  return [
    campo("gupy_education_level", ["education level", "nível de escolaridade", "nivel de escolaridade"], gupy["education-level-en"] || gupy["education-level"], {
      tipo: "combobox",
      prioridade: 1,
      matchIds: ["education-level"],
      aliases: [gupy["education-level"], gupy["education-level-en"]].filter(Boolean),
    }),
    campo("gupy_formation", ["academic qualification", "qualificação acadêmica", "formacao", "formation"], gupy["formation-en"] || gupy.formation, {
      tipo: "combobox",
      prioridade: 1,
      matchIds: ["formation"],
      aliases: [gupy.formation, gupy["formation-en"]].filter(Boolean),
    }),
    campo("gupy_status", ["conclusion status", "status *", "status"], gupy["conclusion-status-en"] || gupy["conclusion-status"], {
      tipo: "combobox",
      prioridade: 1,
      matchIds: ["conclusion-status"],
      aliases: [gupy["conclusion-status"], gupy["conclusion-status-en"]].filter(Boolean),
    }),
    campo("gupy_institution", ["educational institution", "institution name", "instituição de ensino", "institution"], gupy.institution, {
      tipo: "autocomplete",
      prioridade: 1,
      matchIds: ["institution-autocomplete", "institution"],
    }),
    campo("gupy_course", ["course name", "nome do curso", "course"], gupy.course, {
      tipo: "autocomplete",
      prioridade: 1,
      matchIds: ["course-autocomplete", "course"],
    }),
    campo("gupy_start_mes", ["start *", "start month", "mês de início", "mes de inicio"], gupy.start_mes_en || gupy.start_mes, {
      tipo: "combobox",
      prioridade: 2,
      matchIds: ["monthValue"],
      aliases: [gupy.start_mes, gupy.start_mes_en, gupy.start_mes_num, gupy.start_mes_num ? String(Number(gupy.start_mes_num)) : ""].filter(Boolean),
      escopo: "academic",
    }),
    campo("gupy_start_ano", ["start *", "start year", "ano de início", "ano de inicio"], gupy.start_ano, {
      tipo: "combobox",
      prioridade: 2,
      matchIds: ["yearValue"],
      escopo: "academic",
    }),
    campo("gupy_end_mes", ["end *", "end month", "mês de fim", "mes de fim", "conclusion month"], gupy.end_mes_en || gupy.end_mes, {
      tipo: "combobox",
      prioridade: 2,
      matchIds: ["monthValue"],
      aliases: [gupy.end_mes, gupy.end_mes_en, gupy.end_mes_num, gupy.end_mes_num ? String(Number(gupy.end_mes_num)) : ""].filter(Boolean),
      escopo: "academic",
    }),
    campo("gupy_end_ano", ["end *", "end year", "ano de fim", "conclusion year"], gupy.end_ano, {
      tipo: "combobox",
      prioridade: 2,
      matchIds: ["yearValue"],
      escopo: "academic",
    }),
    campo("gupy_company", ["company", "empresa"], gupy.company, {
      prioridade: 1,
      matchIds: ["company"],
      escopo: "professional",
    }),
    campo("gupy_role", ["job title", "cargo", "role", "position"], gupy.role, {
      prioridade: 1,
      matchIds: ["role", "jobTitle", "job-title"],
      escopo: "professional",
    }),
    campo("gupy_exp_start_mes", ["professional start month", "experiência", "experiencia"], gupy.profissional_inicio_mes_en || gupy.profissional_inicio_mes, {
      tipo: "combobox",
      prioridade: 1,
      matchIds: ["monthValue"],
      aliases: [
        gupy.profissional_inicio_mes,
        gupy.profissional_inicio_mes_en,
        gupy.profissional_inicio_mes_num,
        gupy.profissional_inicio_mes_num ? String(Number(gupy.profissional_inicio_mes_num)) : "",
      ].filter(Boolean),
      escopo: "professional",
    }),
    campo("gupy_exp_start_ano", ["professional start year"], gupy.profissional_inicio_ano, {
      tipo: "combobox",
      prioridade: 1,
      matchIds: ["yearValue"],
      escopo: "professional",
    }),
    campo("gupy_exp_end_mes", ["professional end month"], gupy.profissional_fim_mes_en || gupy.profissional_fim_mes, {
      tipo: "combobox",
      prioridade: 1,
      matchIds: ["monthValue"],
      aliases: [
        gupy.profissional_fim_mes,
        gupy.profissional_fim_mes_en,
        gupy.profissional_fim_mes_num,
        gupy.profissional_fim_mes_num ? String(Number(gupy.profissional_fim_mes_num)) : "",
      ].filter(Boolean),
      escopo: "professional",
    }),
    campo("gupy_exp_end_ano", ["professional end year"], gupy.profissional_fim_ano, {
      tipo: "combobox",
      prioridade: 1,
      matchIds: ["yearValue"],
      escopo: "professional",
    }),
    ...camposIdiomasGupy(idiomas),
    campo("gupy_birth", ["date of birth", "data de nascimento", "birth date"], gupy.birthDate, {
      prioridade: 1,
      matchIds: ["birthDate", "birth-date"],
    }),
    campo("gupy_gender", ["gender", "gênero", "select the gender"], gupy["gender-en"] || gupy.gender, {
      tipo: "radio",
      prioridade: 1,
      matchIds: ["gender"],
      aliases: [gupy.gender, gupy["gender-en"], "Male", "Masculino"].filter(Boolean),
    }),
    campo("gupy_disability", ["disabilities", "person with disabilities", "pcd", "deficiência", "do you have a disability"], gupy["hasDisabilities-en"] || gupy.hasDisabilities, {
      tipo: "radio",
      prioridade: 1,
      matchIds: ["hasDisabilities", "has-disabilities"],
      aliases: [gupy.hasDisabilities, gupy["hasDisabilities-en"]].filter(Boolean),
    }),
    campo("gupy_brazil", ["live in brazil", "mora no brasil", "do you live in brazil"], gupy["addressBrazil-en"] || gupy.addressBrazil, {
      tipo: "radio",
      prioridade: 1,
      matchIds: ["addressBrazil", "address-brazil"],
      aliases: [gupy.addressBrazil, gupy["addressBrazil-en"], "Yes", "Sim"].filter(Boolean),
    }),
    campo("gupy_zip", ["zip code", "cep"], gupy.addressZipCode, {
      prioridade: 1,
      matchIds: ["addressZipCode", "address-zip", "zipCode"],
    }),
    campo("gupy_street", ["address *", "endereço", "street"], gupy.addressStreet, {
      prioridade: 1,
      matchIds: ["addressStreet", "address-street"],
    }),
    campo("gupy_state", ["address state", "estado *", "state"], gupy.addressState, {
      tipo: "combobox",
      prioridade: 1,
      matchIds: ["addressState", "address-state"],
    }),
    campo("gupy_city", ["address city", "cidade *", "city"], gupy.addressCity, {
      tipo: "combobox",
      prioridade: 1,
      matchIds: ["addressCity", "address-city"],
    }),
    campo("gupy_linkedin", ["linkedin", "profile url"], gupy.linkedinProfileUrl, {
      prioridade: 1,
      matchIds: ["linkedinProfileUrl", "linkedin"],
    }),
    campo("gupy_cpf", ["your id", "documento", "identity card", "cpf"], gupy.identityCardNumber, {
      prioridade: 1,
      matchIds: ["identityCardNumber", "identity-card"],
    }),
    campo("gupy_origin_state", ["state of origin", "estado de origem"], gupy.stateOfOrigin, {
      tipo: "combobox",
      prioridade: 1,
      matchIds: ["stateOfOrigin", "state-of-origin"],
    }),
    campo("gupy_origin_city", ["city of origin", "cidade de origem"], gupy.cityOfOrigin, {
      tipo: "combobox",
      prioridade: 1,
      matchIds: ["cityOfOrigin", "city-of-origin"],
    }),
    campo("gupy_pronoun", ["pronoun", "pronome", "which pronoun"], gupy["genderPronoun-en"] || gupy.genderPronoun, {
      tipo: "combobox",
      prioridade: 1,
      matchIds: ["genderPronoun", "gender-pronoun"],
      aliases: [gupy.genderPronoun, gupy["genderPronoun-en"]].filter(Boolean),
    }),
    campo("gupy_gender_identity", ["gender identity", "identidade de gênero"], gupy["genderIdentity-en"] || gupy.genderIdentity, {
      tipo: "combobox",
      prioridade: 1,
      matchIds: ["genderIdentity", "gender-identity"],
      aliases: [gupy.genderIdentity, gupy["genderIdentity-en"]].filter(Boolean),
    }),
    campo("gupy_orientation", ["sexual orientation", "orientação sexual", "orientacao sexual"], gupy["sexualOrientation-en"] || gupy.sexualOrientation, {
      tipo: "combobox",
      prioridade: 1,
      matchIds: ["sexualOrientation", "sexual-orientation"],
      aliases: [gupy.sexualOrientation, gupy["sexualOrientation-en"]].filter(Boolean),
    }),
    campo("gupy_race", ["race or skin", "race/color", "cor ou raça", "cor ou raca", "what's your race"], gupy["raceColor-en"] || gupy.raceColor, {
      tipo: "combobox",
      prioridade: 1,
      matchIds: ["raceColor", "race-color"],
      aliases: [gupy.raceColor, gupy["raceColor-en"]].filter(Boolean),
    }),
    campo("gupy_consent", ["agree to share", "consentimento", "promoting diversity", "compartilhar este dado"], gupy.diversityConsent, {
      tipo: "combobox",
      prioridade: 1,
      matchIds: ["diversityConsent", "diversity-consent"],
    }),
    campo("gupy_skill", ["skill (optional)", "habilidade", "write and select a skill"], skills[0] || gupy["skills-search-autocomplete"], {
      tipo: "skills",
      prioridade: 1,
      matchIds: ["skills-search-autocomplete", "skills-search"],
      valores: skills,
    }),
  ];
}

/**
 * @param {{
 *   segmento_slug?: string,
 *   portal?: string,
 *   vaga_titulo?: string,
 *   vaga_descricao?: string,
 *   descricao_para_vaga?: string,
 * }} [ctx]
 */
export function montarAutofillCandidato(ctx = {}) {
  const profile = getProfile() ?? {};
  const formacao = getFormacao() ?? {};
  const respostas = getRespostasPadrao() ?? {};
  const busca = getBusca() ?? {};

  const ativos = (busca.segmentos_ativos ?? []).map(resolverPerfilSlug).filter(Boolean);
  const unicos = [...new Set(ativos)];

  const segmentoVaga = ctx.segmento_slug ? resolverPerfilSlug(ctx.segmento_slug) : unicos[0];
  const area1 = labelArea(segmentoVaga || unicos[0]);
  const area2 = labelArea(
    unicos.find((s) => s !== (segmentoVaga || unicos[0])) || unicos[1] || unicos[0],
  );

  const carga = String(formacao.carga_horaria_semanal ?? "");
  const disponibilidade30h =
    /30/.test(carga) || String(respostas.disponibilidade_30h ?? "").toLowerCase() === "sim"
      ? "Sim"
      : respostas.disponibilidade_30h || (carga ? "Sim" : "");

  const como = String(respostas.como_conheceu ?? "LinkedIn").trim() || "LinkedIn";
  const excel = String(respostas.excel ?? "Intermediário").trim() || "Intermediário";

  let descricaoVaga = String(ctx.descricao_para_vaga ?? "").trim();
  if (!descricaoVaga && (ctx.vaga_titulo || ctx.vaga_descricao)) {
    try {
      descricaoVaga = buildDescricaoParaVaga({
        vaga_titulo: ctx.vaga_titulo,
        vaga_descricao: ctx.vaga_descricao,
        segmento_slug: segmentoVaga,
      });
    } catch {
      descricaoVaga = "";
    }
  }

  const base = camposBase({
    profile,
    formacao,
    respostas,
    area1,
    area2,
    disponibilidade30h,
    como,
    excel,
    descricaoVaga,
  });

  const portal = String(ctx.portal ?? "").toLowerCase();
  let campos = base;
  let fonteVerdade = false;

  if (!portal || portal === "gupy" || portal === "auto") {
    try {
      const gupy = camposGupy(montarValoresEstruturaPortal("gupy"));
      // Tuma (molde Gupy) primeiro → sobrescreve o que estiver na página
      campos = [...gupy, ...base];
      fonteVerdade = true;
    } catch {
      /* sem dados locais */
    }
  }

  campos = campos.filter(
    (c) =>
      String(c.valor ?? "").trim() ||
      (Array.isArray(c.valores) && c.valores.some((v) => String(v).trim())),
  );

  return {
    gerado_em: new Date().toISOString(),
    portal: portal || null,
    fonte_verdade: fonteVerdade,
    sobrescrever: true,
    profile: {
      nome: profile.nome ?? "",
      email: profile.email ?? "",
      telefone: profile.telefone || profile.whatsapp || "",
    },
    formacao: {
      curso: formacao.curso ?? "",
      turno: formacao.turno ?? "",
      previsao_formatura: formacao.previsao_formatura ?? "",
      instituicao: formacao.instituicao ?? "",
    },
    campos,
  };
}
