/**
 * Motor Sólides — monta o perfil no formato Profiler (não usa estrutura ATS do cv-base).
 * Fonte: banco.yml, formacao, tecnologias, portais/solides.yml + contexto da vaga.
 */

import {
  certificacoesParaSegmento,
  experienciaParaSegmento,
  loadBanco,
  projetosParaSegmento,
} from "./conteudoBanco.js";
import { getPortalSolides } from "./dados.js";
import { getFonteCandidato } from "./fonteCandidato.js";
import { getPerfil, inferirPerfilPorVaga, resolverPerfilSlug } from "./perfilCvSegmento.js";
import { SEGMENTOS_CV_SLOTS } from "./conteudoConstants.js";
import { classificarVaga, montarPedidoVaga, tituloFromVaga } from "./adaptarCvVaga.js";
import {
  atualizarMetaSegmentacao,
  criarSegmentacao,
  getPacoteSolides,
  getSegmentacao,
  salvarPacoteSolides,
  salvarSegmentacaoConteudo,
} from "./segmentacoes.js";

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

/** Seções do Profiler — não confundir com Resumo/Competências/Projetos do cv-base ATS. */
export const SECOES_SOLIDES = [
  "Resumo profissional",
  "Cargo(s) de interesse",
  "Experiência profissional",
  "Formação acadêmica",
  "Cursos e certificações",
  "Habilidades",
  "Idiomas",
];

const MOTOR_SOLIDES_VERSAO = 2;

function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function scoreTexto(texto, termos, peso = 1) {
  const lower = normalize(texto);
  let score = 0;
  for (const termo of termos) {
    if (lower.includes(normalize(termo))) score += peso;
  }
  return score;
}

function termosVaga(titulo, descricao) {
  const blob = `${titulo ?? ""}\n${descricao ?? ""}`;
  return blob
    .toLowerCase()
    .split(/[^\p{L}\p{N}+#.]+/u)
    .map((w) => w.trim())
    .filter((w) => w.length > 2);
}

function markdownParaTexto(md) {
  return String(md ?? "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/^-\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function tituloVagaLimpo(titulo) {
  return String(titulo ?? "")
    .replace(/^candidat[oa]\s+(a|ao|à)\s+/i, "")
    .replace(/^vaga\s+(para|de)\s+/i, "")
    .trim();
}

function mesAnoParaSolides(token) {
  const raw = String(token ?? "").trim();
  if (!raw) return "";

  const numerico = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (numerico) {
    return `${numerico[1].padStart(2, "0")}/${numerico[2]}`;
  }

  const abrev = raw.match(/^([a-z]{3})\/(\d{4})$/i);
  if (abrev) {
    const mes = MESES_ABREV[abrev[1].toLowerCase()];
    if (mes) return `${mes}/${abrev[2]}`;
  }

  return raw;
}

export function parsePeriodoSolides(periodo) {
  const raw = String(periodo ?? "").trim();
  if (!raw) {
    return { inicio: "", fim: "", texto: "" };
  }

  const jaSolides = raw.match(
    /(\d{2}\/\d{4})\s*(?:até|–|—|-)\s*(\d{2}\/\d{4}|atual|presente)/i,
  );
  if (jaSolides) {
    const fim = /atual|presente/i.test(jaSolides[2]) ? "atual" : jaSolides[2];
    return {
      inicio: jaSolides[1],
      fim,
      texto: `${jaSolides[1]} até ${fim}`,
    };
  }

  const partes = raw.split(/\s*[–—-]\s*/).map((p) => p.trim()).filter(Boolean);
  if (partes.length >= 2) {
    const inicio = mesAnoParaSolides(partes[0]);
    const fimRaw = partes[1];
    const fim = /atual|presente|cursando/i.test(fimRaw) ? "atual" : mesAnoParaSolides(fimRaw);
    return { inicio, fim, texto: `${inicio} até ${fim}` };
  }

  return { inicio: mesAnoParaSolides(raw), fim: "", texto: raw };
}

function resolverSegmentoVaga(input, pedido, fonte) {
  const raw = String(input?.segmento_slug ?? "").trim();
  if (raw && SEGMENTOS_CV_SLOTS.includes(raw)) {
    return resolverPerfilSlug(raw);
  }
  return inferirPerfilPorVaga(pedido.vaga_titulo, pedido.vaga_descricao, fonte);
}

function textoFormacao(formacao) {
  const f = formacao ?? {};
  if (!f.instituicao && !f.curso) return "";

  const curso = [f.grau, f.curso].filter(Boolean).join(" em ");
  const sem = f.semestre ? `, ${f.semestre}º semestre` : "";
  const status = f.status === "Cursando" ? "cursando" : f.status?.toLowerCase() ?? "";

  return `Sou ${status ? `${status} ` : ""}${curso || "estudante"} no ${f.instituicao}${sem}.`.replace(
    /\s{2,}/g,
    " ",
  );
}

function tecnologiasAderentesVaga(fonte, termos, max = 5) {
  return (fonte.tecnologias?.comNivel ?? [])
    .filter((t) => {
      const nome = normalize(t.nome);
      return termos.some(
        (termo) => nome.includes(normalize(termo)) || normalize(termo).includes(nome),
      );
    })
    .slice(0, max)
    .map((t) => t.nome);
}

function montarResumoSolides(ctx, fonte, banco) {
  const perfil = getPerfil(ctx.segmento_slug);
  const cargo = tituloVagaLimpo(ctx.vaga_titulo) || perfil.label;
  const termos = termosVaga(ctx.vaga_titulo, ctx.vaga_descricao);
  const paragrafos = [];

  paragrafos.push(
    `Busco oportunidade como ${cargo}, com entregas em ${perfil.stack.replace(/ · /g, ", ")}.`,
  );

  const formacaoTxt = textoFormacao(fonte.formacao);
  if (formacaoTxt) paragrafos.push(formacaoTxt);

  const expResumo = markdownParaTexto(perfil.resumoExp ?? "");
  if (expResumo) paragrafos.push(expResumo);

  const techs = tecnologiasAderentesVaga(fonte, termos);
  if (techs.length) {
    paragrafos.push(
      `Na prática, utilizo ${techs.join(", ")} — competências alinhadas ao que a vaga descreve.`,
    );
  }

  const exp = experienciaParaSegmento(banco, ctx.segmento_slug);
  if (exp?.bullets?.length) {
    const destaque = reorderBullets(exp.bullets, termos, 1)[0];
    if (destaque) {
      paragrafos.push(markdownParaTexto(destaque));
    }
  }

  return paragrafos.join("\n\n").trim();
}

function montarCargosInteresse(portal, vagaTitulo) {
  const base = [...(portal?.cargos_interesse ?? [])];
  const titulo = tituloVagaLimpo(vagaTitulo);

  if (titulo && !base.some((c) => normalize(c) === normalize(titulo))) {
    base.unshift(titulo);
  }

  return base.slice(0, 5);
}

function parseCargoEmpresa(tituloExp, empresaFallback = "") {
  const titulo = String(tituloExp ?? "").trim();
  const sep = titulo.match(/^(.+?)\s*[—–-]\s*(.+)$/);
  if (sep) {
    return { empresa: sep[1].trim(), cargo: sep[2].trim() };
  }
  return { cargo: titulo || "Experiência", empresa: empresaFallback ?? "" };
}

function reorderBullets(bullets, termos, max = 6) {
  return [...bullets]
    .sort((a, b) => scoreTexto(b, termos, 2) - scoreTexto(a, termos, 2))
    .slice(0, max);
}

function montarExperienciasSolides(banco, segmentoSlug, ctx) {
  const termos = termosVaga(ctx.vaga_titulo, ctx.vaga_descricao);
  const lista = [];

  const exp = experienciaParaSegmento(banco, segmentoSlug);
  if (exp) {
    const { cargo, empresa } = parseCargoEmpresa(exp.titulo, exp.empresa);
    const periodo = parsePeriodoSolides(exp.periodo);
    lista.push({
      cargo,
      empresa: empresa || exp.empresa || "",
      local: exp.local ?? "",
      periodo: periodo.texto,
      periodo_inicio: periodo.inicio,
      periodo_fim: periodo.fim,
      atividades: reorderBullets(exp.bullets ?? [], termos),
      nota: exp.nota ?? "",
      tipo: "profissional",
    });
  }

  const perfil = getPerfil(segmentoSlug);
  const projetos = projetosParaSegmento(banco, segmentoSlug, perfil.projetosOrdem);
  for (const proj of projetos.slice(0, 2)) {
    const bullets = [
      ...(proj.bullets ?? []),
      proj.resumo?.trim(),
      ...(proj.stackUso ?? []).map((s) =>
        typeof s === "string" ? s : `${s.tech}${s.uso ? ` — ${s.uso}` : ""}`,
      ),
    ].filter(Boolean);

    if (!bullets.length) continue;

    lista.push({
      cargo: proj.nome,
      empresa: "Projeto de portfólio",
      local: "",
      periodo: "",
      periodo_inicio: "",
      periodo_fim: "",
      atividades: reorderBullets(bullets, termos, 4),
      nota: "",
      tipo: "projeto",
    });
  }

  return lista;
}

function anoFormacao(formacao) {
  const fim = formacao?.previsao_formatura || formacao?.periodo_fim || "";
  const match = String(fim).match(/(\d{4})/);
  return match?.[1] ?? "";
}

function montarFormacaoSolides(formacao) {
  const f = formacao ?? {};
  if (!f.instituicao && !f.curso) return [];

  const grauCurso = [f.grau, f.curso].filter(Boolean).join(" em ");
  return [
    {
      curso: grauCurso || f.curso || "",
      instituicao: f.instituicao ?? "",
      ano_conclusao: anoFormacao(f),
      situacao: f.status ?? "",
      periodo_inicio: f.periodo_inicio ?? "",
      previsao_formatura: f.previsao_formatura ?? "",
      cidade: [f.cidade_campus, f.estado_campus].filter(Boolean).join(" – "),
    },
  ];
}

function montarCursosSolides(banco, segmentoSlug) {
  return certificacoesParaSegmento(banco, segmentoSlug, { max: 12 }).map((linha) =>
    linha.replace(/^-\s*/, "").trim(),
  );
}

function scoreHabilidade(habilidade, textoVagaNorm) {
  const nomes = [habilidade.nome, habilidade.nome_solides].filter(Boolean);
  let score = 0;

  for (const nome of nomes) {
    const norm = normalize(nome);
    if (textoVagaNorm.includes(norm)) score += 5;
    for (const palavra of norm.split(/\s+/)) {
      if (palavra.length > 3 && textoVagaNorm.includes(palavra)) score += 1;
    }
  }

  return score;
}

function priorizarHabilidadesSolides(portal, vagaTitulo, vagaDescricao) {
  const texto = normalize(`${vagaTitulo}\n${vagaDescricao}`);
  return [...(portal?.habilidades ?? [])]
    .map((h) => ({
      nome: h.nome,
      nome_solides: h.nome_solides ?? h.nome?.toUpperCase(),
      nivel: h.nivel ?? "Intermediário",
      score_vaga: scoreHabilidade(h, texto),
    }))
    .sort((a, b) => b.score_vaga - a.score_vaga);
}

function montarIdiomasSolides(portal) {
  return (portal?.idiomas ?? []).map((i) => ({
    idioma: i.idioma ?? i.nome_solides,
    nome_solides: i.nome_solides ?? String(i.idioma ?? "").toUpperCase(),
    nivel: i.nivel ?? "Intermediário",
  }));
}

export function montarPacoteSolides({
  vaga_titulo,
  vaga_descricao = "",
  vaga_url = "",
  segmento_slug,
  fonte = null,
  portal = null,
}) {
  const f = fonte ?? getFonteCandidato();
  const p = portal ?? getPortalSolides();
  const slug = resolverPerfilSlug(segmento_slug);
  const banco = f.banco ?? loadBanco();

  const ctx = {
    vaga_titulo,
    vaga_descricao,
    segmento_slug: slug,
  };

  const campos = {
    resumo_profissional: montarResumoSolides(ctx, f, banco),
    cargos_interesse: montarCargosInteresse(p, vaga_titulo),
    experiencias: montarExperienciasSolides(banco, slug, ctx),
    formacao: montarFormacaoSolides(f.formacao),
    cursos_certificacoes: montarCursosSolides(banco, slug),
    habilidades: priorizarHabilidadesSolides(p, vaga_titulo, vaga_descricao),
    idiomas: montarIdiomasSolides(p),
  };

  return {
    portal: "solides",
    estrutura: SECOES_SOLIDES,
    motor_versao: MOTOR_SOLIDES_VERSAO,
    gerado_em: new Date().toISOString(),
    portal_config_atualizado_em: p.atualizado_em ?? null,
    vaga: {
      titulo: vaga_titulo,
      descricao: vaga_descricao,
      url: vaga_url || null,
    },
    segmento_slug: slug,
    candidato: {
      nome: f.profile?.nome ?? "",
    },
    campos,
  };
}

export function formatarMarkdownSolides(pacote) {
  const c = pacote.campos;
  const linhas = [
    `# Perfil Sólides — ${pacote.vaga?.titulo ?? "Vaga"}`,
    "",
    "## Resumo profissional",
    "",
    c.resumo_profissional,
    "",
    "## Cargo(s) de interesse",
    "",
    ...c.cargos_interesse.map((cargo) => `- ${cargo}`),
    "",
    "## Experiência profissional",
    "",
  ];

  if (!c.experiencias.length) {
    linhas.push("_Sem experiência cadastrada no banco para este segmento._", "");
  }

  for (const exp of c.experiencias) {
    linhas.push(`### ${exp.cargo}${exp.empresa ? ` — ${exp.empresa}` : ""}`);
    if (exp.periodo) linhas.push("", `**Período:** ${exp.periodo}`);
    if (exp.local) linhas.push(`**Local:** ${exp.local}`);
    linhas.push("");
    for (const atv of exp.atividades ?? []) {
      linhas.push(`- ${markdownParaTexto(atv)}`);
    }
    if (exp.nota) linhas.push("", `*${exp.nota}*`);
    linhas.push("");
  }

  linhas.push("## Formação acadêmica", "");
  if (!c.formacao.length) {
    linhas.push("_Sem formação cadastrada._", "");
  }
  for (const form of c.formacao) {
    const titulo = [form.instituicao, form.curso].filter(Boolean).join(" — ");
    linhas.push(`### ${titulo}`);
    const extras = [form.ano_conclusao && `Conclusão: ${form.ano_conclusao}`, form.situacao]
      .filter(Boolean)
      .join(" · ");
    if (extras) linhas.push("", extras);
    linhas.push("");
  }

  linhas.push("## Cursos e certificações", "");
  if (!c.cursos_certificacoes.length) {
    linhas.push("_Sem cursos cadastrados._", "");
  } else {
    linhas.push(...c.cursos_certificacoes.map((curso) => `- ${curso}`), "");
  }

  linhas.push("## Habilidades", "");
  for (const h of c.habilidades) {
    const destaque = h.score_vaga > 0 ? " ★" : "";
    linhas.push(`- ${h.nome_solides} — ${h.nivel}${destaque}`);
  }
  linhas.push("");

  linhas.push("## Idiomas", "");
  for (const i of c.idiomas) {
    linhas.push(`- ${i.nome_solides} — ${i.nivel}`);
  }
  linhas.push("");

  if (c.habilidades.some((h) => h.score_vaga > 0)) {
    linhas.push(
      "> ★ Habilidades marcadas têm maior aderência ao texto da vaga (ordem priorizada para o Profiler).",
      "",
    );
  }

  return linhas.join("\n").trim() + "\n";
}

export async function executarPacoteSolidesVaga(input) {
  const descricao = String(input?.vaga_descricao ?? "").trim();
  const segmentacaoId = String(input?.segmentacao_id ?? "").trim();
  const fonte = getFonteCandidato();

  let segmentacao;
  let segmento_slug;
  let vaga_titulo;
  let vaga_descricao;

  if (segmentacaoId) {
    segmentacao = getSegmentacao(segmentacaoId);
    if (!segmentacao) {
      return { status: "erro", motivo: "segmentacao_nao_encontrada" };
    }

    const pedido = {
      vaga_titulo: segmentacao.vaga_titulo,
      vaga_descricao: descricao || segmentacao.vaga_descricao || "",
    };
    segmento_slug =
      resolverSegmentoVaga(input, pedido, fonte) || segmentacao.segmento_slug;
    vaga_titulo =
      tituloFromVaga(input?.vaga_titulo, pedido.vaga_descricao) || segmentacao.vaga_titulo;
    vaga_descricao = pedido.vaga_descricao;
  } else {
    if (descricao.length < 20) {
      return { status: "erro", motivo: "descricao_curta" };
    }

    const pedido = montarPedidoVaga({
      vaga_titulo: input?.vaga_titulo,
      vaga_descricao: descricao,
    });
    segmento_slug = resolverSegmentoVaga(input, pedido, fonte);
    vaga_titulo = pedido.vaga_titulo;
    vaga_descricao = pedido.vaga_descricao;
  }

  const pacote = montarPacoteSolides({
    vaga_titulo,
    vaga_descricao,
    vaga_url: String(input?.vaga_url ?? "").trim(),
    segmento_slug,
    fonte,
  });

  const preview = formatarMarkdownSolides(pacote);
  const classificacao = classificarVaga({ vaga_titulo, vaga_descricao });

  if (segmentacaoId) {
    salvarSegmentacaoConteudo(segmentacaoId, preview);
    segmentacao = atualizarMetaSegmentacao(segmentacaoId, {
      portal: "solides",
      segmento_slug,
      formato_cv: "solides",
      motor_solides_versao: MOTOR_SOLIDES_VERSAO,
    });
  } else {
    segmentacao = criarSegmentacao({
      vaga_titulo,
      vaga_descricao,
      origem: "vaga",
      segmento_slug,
      conteudoMd: preview,
      portal: "solides",
      formato_cv: "solides",
      motor_solides_versao: MOTOR_SOLIDES_VERSAO,
    });
  }

  salvarPacoteSolides(segmentacao.id, pacote, preview);

  return {
    status: "concluido",
    portal: "solides",
    estrutura: SECOES_SOLIDES,
    segmentacao,
    segmentacao_id: segmentacao.id,
    segmento_slug,
    segmento_label: classificacao.segmento_label,
    scores: classificacao.scores,
    solides: pacote,
    preview,
    pacote_salvo: getPacoteSolides(segmentacao.id),
  };
}

export { MOTOR_SOLIDES_VERSAO };
