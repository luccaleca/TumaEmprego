/**
 * Fonte unificada do candidato — perfil, conteúdo, tecnologias, busca, resultados.
 * O motor de CV e os prompts devem consultar aqui antes de montar o currículo.
 */

import fs from "fs";
import path from "path";
import { parse } from "yaml";
import { getBusca, getConteudoAtividades, getConteudoBanco, getCvBase, getFormacao, getProfile, getRespostasPadrao, getTecnologias } from "./dados.js";
import { LABELS_SEGMENTO } from "./conteudoConstants.js";
import { extrairTecnologiasPerfil } from "./tecnologiasUtils.js";

const DADOS_ROOT = path.join(process.cwd(), "..", "dados");

function safe(fn, fallback = null) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function listarResultados() {
  const dir = path.join(DADOS_ROOT, "resultados");
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .map((f) => {
      try {
        const raw = fs.readFileSync(path.join(dir, f), "utf8");
        return { arquivo: f, ...parse(raw) };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

/** Termos em minúsculo para pontuação de JD e reordenação de bullets. */
export function termosTecnologiaCandidato(fonte) {
  const f = fonte ?? getFonteCandidato();
  const lista = f.tecnologias?.todas ?? [];
  return lista.map((t) => t.toLowerCase());
}

export function termosParaSegmento(slug, fonte) {
  const f = fonte ?? getFonteCandidato();
  const termos = new Set();

  for (const t of f.tecnologias?.comNivel ?? []) {
    const segmentos = t.segmentosCv ?? [];
    if (segmentos.length && segmentos.includes(slug)) {
      termos.add(String(t.nome).toLowerCase());
    }
  }

  return [...termos];
}

export function getFonteCandidato() {
  const profile = safe(() => getProfile(), {});
  const formacao = safe(() => getFormacao(), {});
  const tecnologiasRaw = safe(() => getTecnologias(), {});
  const tecnologias = extrairTecnologiasPerfil(tecnologiasRaw);
  const busca = safe(() => getBusca(), {});
  const banco = safe(() => getConteudoBanco(), {});
  const atividades = safe(() => getConteudoAtividades(), { atividades: [] });
  const cvBase = safe(() => getCvBase(), "");
  const respostas = safe(() => getRespostasPadrao(), {});
  const resultados = listarResultados();

  return {
    carregado_em: new Date().toISOString(),
    profile,
    formacao,
    tecnologias,
    tecnologiasRaw,
    busca,
    banco,
    atividades,
    cv_base: cvBase,
    respostas,
    resultados,
    segmentos_ativos: busca?.segmentos_ativos ?? [],
  };
}

export function formatarContatoCv(profile, cvBaseFallback = "") {
  const p = profile ?? {};
  const cidade = [p.cidade, p.estado].filter(Boolean).join(", ");
  const email = p.email ?? "";
  const tel = p.telefone ?? p.whatsapp ?? "";
  const linkedin = p.linkedin ?? "";
  const github = p.github ?? "";

  const partes = [cidade, email, tel, linkedin, github].filter(Boolean);
  if (partes.length >= 2) {
    return partes.join(" · ");
  }

  const linha = String(cvBaseFallback)
    .split("\n")
    .find((l) => l.includes("@") && !l.startsWith("#"));
  return linha?.trim() ?? "";
}

export function formatarFormacaoCv(formacao) {
  const f = formacao ?? {};
  if (!f.instituicao && !f.curso) return "";

  const titulo = [f.instituicao, f.grau && f.curso ? `— ${f.grau} em ${f.curso}` : f.curso]
    .filter(Boolean)
    .join(" ");

  const periodo = [f.periodo_inicio, f.previsao_formatura || f.periodo_fim]
    .filter(Boolean)
    .join(" – ");

  const local = [f.cidade_campus, f.estado_campus].filter(Boolean).join(" – ");
  const extras = [f.status === "Cursando" ? "(cursando)" : f.status, f.turno].filter(Boolean);

  const linhaPeriodo = [periodo, local, ...extras].filter(Boolean).join(" · ");

  return `### ${titulo}\n\n**Período:** ${linhaPeriodo || "—"}`;
}

/** Resumo em markdown para prompts de IA — não vai para o PDF. */
export function montarContextoFonteParaPrompt(fonte, { segmentoSlug, vagaTitulo, vagaDescricao } = {}) {
  const f = fonte ?? getFonteCandidato();
  const linhas = [
    "## Fonte do candidato (consultar — não inventar além disso)",
    "",
    "### Perfil",
    `- Nome: ${f.profile?.nome ?? "—"}`,
    `- Formação buscada: ${(f.busca?.segmentos_ativos ?? []).map((s) => LABELS_SEGMENTO[s] ?? s).join(", ") || "—"}`,
    `- Senioridades: ${(f.busca?.senioridades ?? []).join(", ") || "—"}`,
    "",
    "### Tecnologias (perfil)",
  ];

  for (const t of f.tecnologias?.comNivel ?? []) {
    linhas.push(`- ${t.nome}`);
  }

  linhas.push("", "### Formação acadêmica");
  linhas.push(
    `- ${f.formacao?.instituicao ?? "—"} — ${f.formacao?.curso ?? "—"} (${f.formacao?.status ?? "—"})`,
  );

  linhas.push("", "### Experiências e projetos (banco.yml)");
  for (const exp of f.banco?.experiencias ?? []) {
    linhas.push(`- ${exp.empresa} (${exp.periodo ?? "—"})`);
  }
  for (const proj of f.banco?.projetos ?? []) {
    const seg = segmentoSlug;
    const resumo = seg
      ? (proj.resumo_por_segmento?.[seg] ?? proj.subtitulo_por_segmento?.[seg])
      : null;
    const stack = seg ? (proj.stack_uso_por_segmento?.[seg] ?? []) : [];
    linhas.push(`- Projeto: ${proj.nome}${resumo ? ` — ${resumo}` : ""}`);
    for (const item of stack) {
      linhas.push(`  - ${typeof item === "string" ? item : `${item.tech} — ${item.uso ?? ""}`}`);
    }
  }

  if (f.resultados?.length) {
    linhas.push("", "### Resultados / métricas (resultados/)");
    for (const r of f.resultados) {
      linhas.push(`- ${r.empresa ?? r.arquivo}`);
      for (const feito of r.feitos ?? []) {
        if (feito.metricas) {
          linhas.push(`  - ${feito.o_que_fiz}: ${JSON.stringify(feito.metricas)}`);
        }
      }
    }
  }

  if (segmentoSlug) {
    linhas.push("", `### Segmento alvo: ${LABELS_SEGMENTO[segmentoSlug] ?? segmentoSlug}`);
    linhas.push(`Termos do candidato neste segmento: ${termosParaSegmento(segmentoSlug, f).join(", ")}`);
  }

  if (vagaTitulo || vagaDescricao) {
    linhas.push("", "### Vaga", `**${vagaTitulo ?? "—"}**`, "", vagaDescricao ?? "");
  }

  linhas.push(
    "",
    "### Arquivos de referência",
    "- dados/cv-base.md",
    "- dados/conteudo/banco.yml",
    "- dados/conteudo/atividades.yml",
    "- dados/config/tecnologias.yml",
    "- dados/config/formacao.yml",
    "- dados/config/profile.yml",
    "- dados/resultados/*.yml",
  );

  return linhas.join("\n");
}
