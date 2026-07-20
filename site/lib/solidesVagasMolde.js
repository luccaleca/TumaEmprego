/**
 * Molde JSON do formulário Sólides Vagas — referência para motor e IA.
 */

import { ABAS_SOLIDES_VAGAS } from "./solidesVagasEstrutura.js";

export const MOLDE_SOLIDES_VAGAS_ID = "solides-vagas-v1";

export const MOLDE_SLOTS_VAZIOS = {
  experiencias: 2,
  formacao: 1,
  habilidades: 3,
  idiomas: 1,
};

/** @returns {object} */
export function getMoldeSolidesVagasJson() {
  return {
    id: MOLDE_SOLIDES_VAGAS_ID,
    portal: "solides",
    base_url: "https://perfil.vagas.solides.com.br/curriculo",
    abas: ABAS_SOLIDES_VAGAS.map((aba) => ({
      id: aba.id,
      titulo: aba.titulo,
      url: aba.url,
      campos: aba.campos.map((c) => ({
        id: c.id,
        label: c.label,
        obrigatorio: Boolean(c.obrigatorio),
      })),
    })),
    slots_vazios: MOLDE_SLOTS_VAZIOS,
  };
}

/**
 * Valores por aba/campo — mesmo formato do molde, para preenchimento.
 * @param {object} pacote
 */
export function camposPorAbaFromPacote(pacote) {
  const c = pacote?.campos ?? {};
  const cand = pacote?.candidato ?? {};
  const profile = pacote?.perfil_candidato ?? {};
  const vagaTitulo = pacote?.vaga?.titulo ?? "";

  const limpar = (s) =>
    String(s ?? "")
      .replace(/\*\*/g, "")
      .replace(/^-\s*/, "")
      .trim();

  return {
    sobre: {
      nome_completo: cand.nome || profile.nome || "",
      email: profile.email || "",
      celular: profile.celular || profile.telefone || "",
      data_nascimento: profile.data_nascimento || "",
      cpf: profile.cpf || "",
      cidade_estado: [profile.cidade, profile.estado].filter(Boolean).join(" – "),
      apresentacao: c.resumo_profissional || "",
      cargo_interesse: c.cargos_interesse?.[0] || vagaTitulo || "",
    },
    experiencias: {
      resumo_trajetoria: c.resumo_profissional || "",
      itens: (c.experiencias ?? []).map((e) => ({
        cargo: e.cargo || "",
        empresa: e.empresa || "",
        inicio: e.periodo_inicio || "",
        fim: e.periodo_fim || "",
        local: e.local || "",
        atividades: (e.atividades ?? []).map(limpar).filter(Boolean),
      })),
      formacao: (c.formacao ?? []).map((f) => {
        const ano =
          String(f.ano_conclusao || f.previsao_formatura || "")
            .match(/(\d{4})/)?.[1] ?? "";
        const nivel =
          f.nivel ||
          (String(f.grau || "").toLowerCase().includes("bacharel") ? "Graduação" : "") ||
          (String(f.curso || f.grau_curso || "").match(/^([^e]+)\s+em\s+/i)?.[1]?.trim() ?? "");
        const cursoNome = String(f.curso || f.grau_curso || "")
          .replace(/^(bacharelado|licenciatura|tecn[oó]logo|gradua[cç][aã]o)\s+em\s+/i, "")
          .trim();
        return {
          grau_curso: nivel && cursoNome ? `${nivel} — ${cursoNome}` : cursoNome || f.grau_curso || "",
          nivel: nivel || "Graduação",
          curso: cursoNome,
          instituicao: f.instituicao || "",
          inicio: f.periodo_inicio || f.inicio || "",
          fim: ano,
          situacao: f.situacao || "",
          cidade: f.cidade || "",
        };
      }),
      cursos_certificacoes: (c.cursos_certificacoes ?? []).map((item) => {
        if (item && typeof item === "object") {
          return {
            curso: item.curso || item.titulo || "",
            instituicao: item.instituicao || "",
            nivel: item.nivel || "Curso Extracurricular",
            ano_conclusao: String(item.ano_conclusao || item.ano || "").match(/(\d{4})/)?.[1] || "",
            descricao: item.descricao || "",
          };
        }
        const limpa = String(item ?? "")
          .replace(/^-\s*/, "")
          .trim();
        const [tituloParte, resto] = limpa.split(" — ");
        return {
          curso: (tituloParte || limpa).trim(),
          instituicao:
            (resto && resto.replace(/\s*\([^)]*\)\s*$/, "").trim()) ||
            limpa.match(/\(([^)]+)\)\s*$/)?.[1] ||
            "",
          nivel: "Curso Extracurricular",
          ano_conclusao: "",
          descricao: "",
        };
      }),
    },
    habilidades: {
      itens: (c.habilidades ?? []).map((h) => ({
        nome: h.nome_solides || h.nome || "",
        nivel: h.nivel || "",
      })),
      idiomas: (c.idiomas ?? []).map((i) => ({
        idioma: i.idioma || i.nome_solides || "",
        nivel: i.nivel || "",
      })),
    },
    "outras-informacoes": {
      campos_empresa: "",
    },
  };
}

/** Objeto vazio com slots do molde. */
export function camposPorAbaVazios() {
  const { experiencias, formacao, habilidades, idiomas } = MOLDE_SLOTS_VAZIOS;

  return {
    sobre: Object.fromEntries(
      ABAS_SOLIDES_VAGAS.find((a) => a.id === "sobre").campos.map((f) => [f.id, ""]),
    ),
    experiencias: {
      resumo_trajetoria: "",
      itens: Array.from({ length: experiencias }, () => ({
        cargo: "",
        empresa: "",
        inicio: "",
        fim: "",
        local: "",
        atividades: [],
      })),
      formacao: Array.from({ length: formacao }, () => ({
        grau_curso: "",
        nivel: "",
        curso: "",
        instituicao: "",
        inicio: "",
        fim: "",
        situacao: "",
        cidade: "",
      })),
      cursos_certificacoes: [],
    },
    habilidades: {
      itens: Array.from({ length: habilidades }, () => ({ nome: "", nivel: "" })),
      idiomas: Array.from({ length: idiomas }, () => ({ idioma: "", nivel: "" })),
    },
    "outras-informacoes": { campos_empresa: "" },
  };
}
