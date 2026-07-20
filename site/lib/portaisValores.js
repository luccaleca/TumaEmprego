/**
 * Valores preenchidos por campo das estruturas de portal (Sólides / Gupy).
 * Fonte: profile, formação, banco, tecnologias, portais/*.yml — sem inventar.
 */

import { montarPacoteSolides } from "./adaptarSolides.js";
import { loadBanco, certificacoesParaSegmento } from "./conteudoBanco.js";
import {
  getPortalCampos,
  getPortalSolides,
  getProfile,
  getFormacao,
  getRespostasPadrao,
} from "./dados.js";
import { getFonteCandidato } from "./fonteCandidato.js";
import { slugsSegmentosAtivos } from "./segmentosAtivos.js";
import { camposPorAbaFromPacote } from "./solidesVagasMolde.js";

function txt(v) {
  if (v == null) return "";
  if (Array.isArray(v)) {
    return v
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.nome && item?.nivel) return `${item.nome} (${item.nivel})`;
        if (item?.idioma && item?.nivel) return `${item.idioma} (${item.nivel})`;
        if (item?.titulo) return item.titulo;
        return "";
      })
      .filter(Boolean)
      .join("; ");
  }
  return String(v).trim();
}

function parsePeriodoExp(periodo) {
  const raw = String(periodo ?? "");
  const partes = raw.split(/\s*[–—-]\s*/);
  return {
    inicio: (partes[0] ?? "").trim(),
    fim: (partes[1] ?? "").trim(),
  };
}

function generoGupy(sexo) {
  const s = String(sexo ?? "").toLowerCase();
  if (s.startsWith("masc")) return "Masculino";
  if (s.startsWith("fem")) return "Feminino";
  return sexo || "";
}

function statusFormacaoGupy(status) {
  const s = String(status ?? "").toLowerCase();
  if (s.includes("curs")) return "Em andamento";
  if (s.includes("concl")) return "Concluído";
  return status || "";
}

function grauParaNivelGupy(grau) {
  const g = String(grau ?? "").toLowerCase();
  if (g.includes("bacharel") || g.includes("gradua")) return "Ensino superior";
  if (g.includes("técn") || g.includes("tecnologo")) return "Ensino superior";
  if (g.includes("médio")) return "Ensino médio";
  return grau || "Ensino superior";
}

function grauParaNivelGupyEn(grau) {
  const g = String(grau ?? "").toLowerCase();
  if (g.includes("médio") && !g.includes("superior")) return "High school";
  return "Higher degree";
}

function formationGupyEn(grau) {
  const g = String(grau ?? "").toLowerCase();
  if (g.includes("bacharel") || g.includes("gradua")) return "Undergraduate";
  if (g.includes("tecnologo") || g.includes("tecnólogo")) return "Technological";
  if (g.includes("mestrado")) return "Master's degree";
  return "Undergraduate";
}

function statusFormacaoGupyEn(status) {
  const s = String(status ?? "").toLowerCase();
  if (s.includes("curs")) return "In progress";
  if (s.includes("concl")) return "Completed";
  return "In progress";
}

const MESES_ABREV = {
  jan: "01",
  fev: "02",
  mar: "03",
  abr: "04",
  mai: "05",
  jun: "06",
  jul: "07",
  ago: "08",
  set: "09",
  out: "10",
  nov: "11",
  dez: "12",
};

const MESES_EN = {
  "01": "January",
  "02": "February",
  "03": "March",
  "04": "April",
  "05": "May",
  "06": "June",
  "07": "July",
  "08": "August",
  "09": "September",
  "10": "October",
  "11": "November",
  "12": "December",
};

const MESES_PT = {
  "01": "Janeiro",
  "02": "Fevereiro",
  "03": "Março",
  "04": "Abril",
  "05": "Maio",
  "06": "Junho",
  "07": "Julho",
  "08": "Agosto",
  "09": "Setembro",
  "10": "Outubro",
  "11": "Novembro",
  "12": "Dezembro",
};

/** @returns {{ mes: string, ano: string, mesEn: string, mesPt: string }} */
export function parseMesAnoGupy(periodo) {
  const raw = String(periodo ?? "").trim();
  const num = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (num) {
    const mes = num[1].padStart(2, "0");
    return {
      mes,
      ano: num[2],
      mesEn: MESES_EN[mes] || mes,
      mesPt: MESES_PT[mes] || mes,
    };
  }
  const abr = raw.match(/^([a-z]{3})\/(\d{4})$/i);
  if (abr) {
    const mes = MESES_ABREV[abr[1].toLowerCase()] || "";
    return {
      mes,
      ano: abr[2],
      mesEn: MESES_EN[mes] || abr[1],
      mesPt: MESES_PT[mes] || abr[1],
    };
  }
  return { mes: "", ano: "", mesEn: "", mesPt: "" };
}

function enderecoLinha(profile) {
  const partes = [
    profile.logradouro,
    profile.numero ? `nº ${profile.numero}` : "",
    profile.complemento,
    profile.bairro,
  ].filter(Boolean);
  return partes.join(", ");
}

function primeiraExp(banco, slug) {
  const lista = banco?.experiencias ?? [];
  const preferida =
    lista.find((e) => (e.segmentos ?? []).includes(slug)) || lista[0] || null;
  if (!preferida) return null;
  const titulo =
    preferida.titulo_por_segmento?.[slug] ||
    preferida.titulo_por_segmento?.[Object.keys(preferida.titulo_por_segmento ?? {})[0]] ||
    preferida.empresa;
  const cargo = String(titulo).replace(/^.*?—\s*/, "").trim() || titulo;
  const { inicio, fim } = parsePeriodoExp(preferida.periodo);
  return {
    empresa: preferida.empresa || "",
    cargo,
    inicio,
    fim,
    local: preferida.local || "",
  };
}

/** @returns {Record<string, string>} */
export function montarValoresEstruturaSolides() {
  const fonte = getFonteCandidato();
  const ativos = slugsSegmentosAtivos();
  const slug = ativos[0] || "desenvolvimento";
  const pacote = montarPacoteSolides({
    vaga_titulo: "",
    vaga_descricao: "",
    segmento_slug: slug,
    fonte,
  });
  const aba = camposPorAbaFromPacote(pacote);
  const profile = fonte.profile ?? getProfile() ?? {};
  const portal = getPortalSolides() ?? {};

  const exp0 = aba.experiencias?.itens?.[0] ?? {};
  const form0 = aba.experiencias?.formacao?.[0] ?? {};

  return {
    nome_completo: txt(aba.sobre?.nome_completo || profile.nome),
    email: txt(aba.sobre?.email || profile.email),
    celular: txt(aba.sobre?.celular || profile.telefone || profile.whatsapp),
    data_nascimento: txt(aba.sobre?.data_nascimento || profile.data_nascimento),
    cpf: txt(profile.cpf),
    cidade_estado: txt(
      aba.sobre?.cidade_estado ||
        [profile.cidade, profile.estado].filter(Boolean).join(" – "),
    ),
    apresentacao: txt(aba.sobre?.apresentacao),
    cargo_interesse: txt(
      aba.sobre?.cargo_interesse || (portal.cargos_interesse ?? []).join(", "),
    ),
    resumo_trajetoria: txt(aba.experiencias?.resumo_trajetoria),
    experiencia_cargo: txt(exp0.cargo),
    experiencia_empresa: txt(exp0.empresa),
    experiencia_inicio: txt(exp0.inicio),
    experiencia_fim: txt(exp0.fim),
    experiencia_local: txt(exp0.local),
    experiencia_atividades: txt(exp0.atividades),
    formacao_grau: txt(form0.nivel || "Graduação"),
    formacao_curso: txt(form0.curso || fonte.formacao?.curso || form0.grau_curso),
    formacao_instituicao: txt(form0.instituicao || fonte.formacao?.instituicao),
    formacao_inicio: txt(form0.inicio || fonte.formacao?.periodo_inicio),
    formacao_fim: txt(
      String(form0.fim || fonte.formacao?.previsao_formatura || "").match(/(\d{4})/)?.[1] || "",
    ),
    cursos_certificacoes: txt(aba.experiencias?.cursos_certificacoes),
    habilidade_nome: txt(aba.habilidades?.itens),
    habilidade_nivel: "",
    idioma: txt(aba.habilidades?.idiomas),
    idioma_nivel: "",
    campos_empresa: "",
  };
}

/** @returns {Record<string, string>} */
export function montarValoresEstruturaGupy() {
  const fonte = getFonteCandidato();
  const profile = fonte.profile ?? getProfile() ?? {};
  const formacao = fonte.formacao ?? getFormacao() ?? {};
  const respostas = getRespostasPadrao() ?? {};
  const portalSolides = getPortalSolides() ?? {};
  const banco = fonte.banco ?? loadBanco();
  const ativos = slugsSegmentosAtivos();
  const slug = ativos[0] || "desenvolvimento";
  const exp = primeiraExp(banco, slug);
  const cursos = certificacoesParaSegmento(banco, slug) ?? [];
  const curso0 = String(cursos[0] ?? "")
    .replace(/^-\s*/, "")
    .trim();
  const skills = (fonte.tecnologias?.todas ?? fonte.tecnologias?.comNivel ?? [])
    .map((t) => (typeof t === "string" ? t : t.nome))
    .filter(Boolean)
    .slice(0, 12);

  const idiomasBrutos =
    portalSolides.idiomas?.length > 0
      ? portalSolides.idiomas
      : [
          { idioma: "Português", nivel: "Domínio" },
          { idioma: "Inglês", nivel: respostas.ingles || "Avançado" },
          { idioma: "Espanhol", nivel: respostas.espanhol || "Básico" },
        ];

  // Tuma (respostas) manda no nível — não deixa solides.yml / Gupy velho ganhar
  const idiomas = idiomasBrutos.map((item) => {
    const nome = String(item.idioma ?? "");
    if (/espanhol|spanish/i.test(nome)) {
      return { ...item, nivel: respostas.espanhol || item.nivel || "Básico" };
    }
    if (/ingl[eê]s|english/i.test(nome)) {
      return { ...item, nivel: respostas.ingles || item.nivel || "Avançado" };
    }
    return item;
  });

  const iniForm = parseMesAnoGupy(formacao.periodo_inicio);
  const fimForm = parseMesAnoGupy(formacao.previsao_formatura || formacao.periodo_fim);
  const iniExp = parseMesAnoGupy(exp?.inicio);
  const fimExp = parseMesAnoGupy(exp?.fim);

  const nivelIdiomaEn = (nivel) => {
    const n = String(nivel ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
    if (n.includes("nativ") || n.includes("dom")) return "Native/Fluent";
    if (n.includes("avan") || n.includes("advanced")) return "Advanced";
    if (n.includes("inter")) return "Intermediate";
    if (n.includes("bas") || n.includes("basic")) return "Basic";
    return nivel || "Intermediate";
  };

  return {
    "education-level": grauParaNivelGupy(formacao.grau),
    "education-level-en": grauParaNivelGupyEn(formacao.grau),
    formation: txt(formacao.grau) || "Graduação",
    "formation-en": formationGupyEn(formacao.grau),
    "conclusion-status": statusFormacaoGupy(formacao.status),
    "conclusion-status-en": statusFormacaoGupyEn(formacao.status),
    institution: txt(formacao.instituicao).replace(/\s*\(IMT\)\s*/i, " ").trim(),
    course: txt(formacao.curso),
    start: txt(formacao.periodo_inicio),
    end: txt(formacao.previsao_formatura || formacao.periodo_fim),
    start_mes: iniForm.mesPt || iniForm.mesEn || iniForm.mes,
    start_mes_en: iniForm.mesEn,
    start_mes_num: iniForm.mes,
    start_ano: iniForm.ano,
    end_mes: fimForm.mesPt || fimForm.mesEn || fimForm.mes,
    end_mes_en: fimForm.mesEn,
    end_mes_num: fimForm.mes,
    end_ano: fimForm.ano,
    company: txt(exp?.empresa),
    role: txt(exp?.cargo),
    languageName: txt(idiomas.map((i) => i.idioma)),
    languageLevel: txt(idiomas.map((i) => `${i.idioma}: ${i.nivel}`)),
    idiomas: idiomas.map((i) => ({
      idioma: i.idioma,
      nivel: i.nivel,
      nivel_en: nivelIdiomaEn(i.nivel),
    })),
    title: txt(curso0),
    description: "",
    gender: generoGupy(profile.sexo),
    "gender-en": /masc/i.test(String(profile.sexo ?? "")) ? "Male" : "Female",
    hasDisabilities: /sim/i.test(String(profile.pcd ?? "")) ? "Sim" : "Não",
    "hasDisabilities-en": /sim/i.test(String(profile.pcd ?? "")) ? "Yes" : "No",
    addressBrazil: "Sim",
    "addressBrazil-en": "Yes",
    addressZipCode: txt(profile.cep),
    addressStreet: enderecoLinha(profile),
    addressState: (() => {
      const uf = txt(profile.estado);
      const mapa = {
        SP: "São Paulo",
        RJ: "Rio de Janeiro",
        MG: "Minas Gerais",
        RS: "Rio Grande do Sul",
        PR: "Paraná",
        SC: "Santa Catarina",
        BA: "Bahia",
        PE: "Pernambuco",
        CE: "Ceará",
        DF: "Distrito Federal",
      };
      return mapa[uf.toUpperCase()] || uf;
    })(),
    addressCity: txt(profile.cidade),
    linkedinProfileUrl: txt(profile.linkedin),
    identityCardNumber: txt(profile.cpf),
    birthDate: txt(profile.data_nascimento),
    stateOfOrigin: (() => {
      const uf = txt(profile.naturalidade_estado || profile.estado);
      const mapa = {
        SP: "São Paulo",
        RJ: "Rio de Janeiro",
        MG: "Minas Gerais",
        RS: "Rio Grande do Sul",
        PR: "Paraná",
        SC: "Santa Catarina",
        BA: "Bahia",
        PE: "Pernambuco",
        CE: "Ceará",
        DF: "Distrito Federal",
      };
      return mapa[uf.toUpperCase()] || uf;
    })(),
    cityOfOrigin: txt(profile.naturalidade_cidade || profile.cidade),
    genderPronoun:
      txt(profile.pronome) ||
      (generoGupy(profile.sexo).startsWith("Masc") ? "Ele / Dele" : ""),
    "genderPronoun-en": /masc|ele/i.test(String(profile.pronome || profile.sexo || ""))
      ? "He / Him"
      : "She / Her",
    genderIdentity: txt(profile.identidade_genero) || "Cisgênero",
    "genderIdentity-en": "Cisgender",
    sexualOrientation: txt(profile.orientacao_sexual) || "Heterossexual",
    "sexualOrientation-en": "Heterosexual",
    raceColor: txt(profile.cor_ou_raca),
    "raceColor-en": /branco|white/i.test(String(profile.cor_ou_raca ?? "")) ? "White" : txt(profile.cor_ou_raca),
    diversityConsent:
      /sim/i.test(String(profile.consentimento_diversidade ?? ""))
        ? "Sim — compartilhar dados de diversidade"
        : "Sim — compartilhar dados de diversidade",
    skills: skills,
    "skills-search-autocomplete": txt(skills),
    profissional_inicio: txt(exp?.inicio),
    profissional_fim: txt(exp?.fim),
    profissional_inicio_mes: iniExp.mesPt || iniExp.mesEn || iniExp.mes,
    profissional_inicio_mes_en: iniExp.mesEn,
    profissional_inicio_mes_num: iniExp.mes,
    profissional_inicio_ano: iniExp.ano,
    profissional_fim_mes: fimExp.mesPt || fimExp.mesEn || fimExp.mes,
    profissional_fim_mes_en: fimExp.mesEn,
    profissional_fim_mes_num: fimExp.mes,
    profissional_fim_ano: fimExp.ano,
  };
}

function mesclarCamposPortal(portalId, base) {
  const overrides = getPortalCampos(portalId);
  if (!Object.keys(overrides).length) return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(overrides)) {
    if (Array.isArray(out[k])) continue;
    // override vazio não apaga a base (Tuma continua fonte)
    if (!String(v ?? "").trim()) continue;
    out[k] = v;
  }
  return out;
}

/**
 * @param {string} portalId
 * @returns {Record<string, string>}
 */
export function montarValoresEstruturaPortal(portalId) {
  if (portalId === "solides") {
    return mesclarCamposPortal("solides", montarValoresEstruturaSolides());
  }
  if (portalId === "gupy") {
    return mesclarCamposPortal("gupy", montarValoresEstruturaGupy());
  }
  return {};
}

/**
 * @returns {Record<string, Record<string, string>>}
 */
export function montarValoresTodosPortaisEstrutura() {
  return {
    solides: montarValoresEstruturaPortal("solides"),
    gupy: montarValoresEstruturaPortal("gupy"),
  };
}
