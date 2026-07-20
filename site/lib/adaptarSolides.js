/**
 * Pacote Sólides (formulário Profiler), sem layout ATS.
 */

import {
  certificacoesParaSegmento,
  cursosDoBancoParaSegmento,
  experienciaParaSegmento,
  loadBanco,
  projetosParaSegmento,
} from "./conteudoBanco.js";
import { ESTRUTURA_SECOES_SOLIDES } from "./solidesVagasEstrutura.js";
import { markdownSolidesVagasForm } from "./solidesVagasPdf.js";
import {
  camposPorAbaFromPacote,
  getMoldeSolidesVagasJson,
  MOLDE_SOLIDES_VAGAS_ID,
} from "./solidesVagasMolde.js";
import { getPortalSolides } from "./dados.js";
import { getFonteCandidato } from "./fonteCandidato.js";
import { getPerfil, inferirPerfilPorVaga, resolverPerfilSlug } from "./perfilCvSegmento.js";
import { buildDescricaoParaVaga } from "./descricaoVaga.js";
import { SEGMENTOS_CV_SLOTS } from "./conteudoConstants.js";
import { classificarVaga, montarPedidoVaga, tituloFromVaga } from "./adaptarCvVaga.js";
import {
  atualizarMetaSegmentacao,
  criarOuAtualizarSegmentacaoVaga,
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

const MOTOR_SOLIDES_VERSAO = 3;

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

function montarResumoSolides(ctx, fonte, banco) {
  return buildDescricaoParaVaga({
    vaga_titulo: ctx.vaga_titulo,
    vaga_descricao: ctx.vaga_descricao,
    segmento_slug: ctx.segmento_slug,
    fonte: { ...fonte, banco: banco ?? fonte?.banco },
  });
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
  const fim = formacao?.previsao_formatura || formacao?.periodo_fim || formacao?.ano_conclusao || "";
  const match = String(fim).match(/(\d{4})/);
  return match?.[1] ?? "";
}

/** Nível no dropdown Sólides (não misturar com nome do curso). */
function nivelCursoSolides(formacao) {
  const g = String(formacao?.grau ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (g.includes("tecnologo") || g.includes("tecnolog")) return "Tecnólogo";
  if (g.includes("tecnico") || g.includes("técnico")) return "Técnico";
  if (g.includes("mestrado")) return "Mestrado";
  if (g.includes("doutorado")) return "Doutorado";
  if (g.includes("pos") || g.includes("especializ")) return "Pós-graduação";
  if (g.includes("medio") || g.includes("médio")) return "Ensino Médio";
  // Bacharelado / Licenciatura / Graduação
  return "Graduação";
}

function montarFormacaoSolides(formacao) {
  const f = formacao ?? {};
  if (!f.instituicao && !f.curso) return [];

  const ano = anoFormacao(f);
  return [
    {
      curso: String(f.curso ?? "").trim(),
      nivel: nivelCursoSolides(f),
      grau: String(f.grau ?? "").trim(),
      instituicao: f.instituicao ?? "",
      ano_conclusao: ano,
      // Sólides pede só o ano no campo "Ano de conclusão (ou previsão)"
      previsao_formatura: ano,
      situacao: f.status ?? "",
      periodo_inicio: f.periodo_inicio ?? "",
      cidade: [f.cidade_campus, f.estado_campus].filter(Boolean).join(" – "),
    },
  ];
}

/** Nível no modal “Adicionar curso ou certificação” (Sólides). */
function nivelCursoComplementarSolides(curso) {
  const blob = `${curso?.titulo ?? ""} ${curso?.plataforma ?? ""} ${curso?.instrutor ?? ""}`.toLowerCase();
  if (/certifica|skillshop|blueprint|certified/.test(blob)) return "Certificação";
  return "Curso Extracurricular";
}

function instituicaoCursoSolides(curso) {
  const plat = String(curso?.plataforma ?? "").trim();
  if (plat && !/^google$/i.test(plat)) return plat;
  return String(curso?.instrutor ?? plat ?? "").trim();
}

function anoCursoSolides(curso) {
  const raw = curso?.ano_conclusao || curso?.ano || curso?.previsao || "";
  return String(raw).match(/(\d{4})/)?.[1] ?? "";
}

function descricaoCursoSolides(curso) {
  if (curso?.descricao) return String(curso.descricao).trim().slice(0, 2000);
  const partes = [];
  if (curso?.instrutor && instituicaoCursoSolides(curso) !== curso.instrutor) {
    partes.push(`Instrutor: ${curso.instrutor}.`);
  }
  if (curso?.concluido === false) partes.push("Em andamento.");
  else if (curso?.concluido === true) partes.push("Concluído.");
  return partes.join(" ").trim().slice(0, 2000);
}

/** Objetos no formato do modal Sólides. */
function montarCursosSolides(banco, segmentoSlug) {
  const doBanco = cursosDoBancoParaSegmento(banco, segmentoSlug, { max: 12 });
  if (doBanco.length) {
    return doBanco.map((c) => ({
      curso: String(c.titulo ?? "").trim(),
      instituicao: instituicaoCursoSolides(c),
      nivel: c.nivel_solides || nivelCursoComplementarSolides(c),
      ano_conclusao: anoCursoSolides(c),
      descricao: descricaoCursoSolides(c),
    }));
  }

  return certificacoesParaSegmento(banco, segmentoSlug, { max: 12 }).map((linha) => {
    const limpa = linha.replace(/^-\s*/, "").trim();
    const [tituloParte, resto] = limpa.split(" — ");
    const instituicao =
      (resto && resto.replace(/\s*\([^)]*\)\s*$/, "").trim()) ||
      (limpa.match(/\(([^)]+)\)\s*$/)?.[1] ?? "");
    return {
      curso: (tituloParte || limpa).trim(),
      instituicao,
      nivel: nivelCursoComplementarSolides({ titulo: limpa, plataforma: instituicao }),
      ano_conclusao: "",
      descricao: "",
    };
  });
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

  const pacote = {
    portal: "solides",
    molde: MOLDE_SOLIDES_VAGAS_ID,
    estrutura: ESTRUTURA_SECOES_SOLIDES,
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
    perfil_candidato: {
      nome: f.profile?.nome ?? "",
      email: f.profile?.email ?? "",
      celular: f.profile?.celular ?? f.profile?.telefone ?? "",
      cidade: f.profile?.cidade ?? "",
      estado: f.profile?.estado ?? "",
      data_nascimento: f.profile?.data_nascimento ?? "",
    },
    campos,
    abas: ["sobre", "experiencias", "habilidades", "outras-informacoes"],
  };

  pacote.campos_por_aba = camposPorAbaFromPacote(pacote);
  pacote.molde_json = getMoldeSolidesVagasJson();

  return pacote;
}

export function formatarMarkdownSolides(pacote) {
  return markdownSolidesVagasForm(pacote);
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
    vaga_url: String(input?.vaga_url ?? segmentacao?.vaga_url ?? "").trim(),
    segmento_slug,
    fonte,
  });

  const preview = formatarMarkdownSolides(pacote);
  const classificacao = classificarVaga({ vaga_titulo, vaga_descricao });
  const vaga_url = String(input?.vaga_url ?? segmentacao?.vaga_url ?? pacote.vaga?.url ?? "").trim();

  if (segmentacaoId) {
    salvarSegmentacaoConteudo(segmentacaoId, preview);
    segmentacao = atualizarMetaSegmentacao(segmentacaoId, {
      portal: "solides",
      segmento_slug,
      formato_cv: "solides",
      motor_solides_versao: MOTOR_SOLIDES_VERSAO,
      ...(vaga_url ? { vaga_url } : {}),
      ...(String(input?.vaga_empresa ?? "").trim()
        ? { vaga_empresa: String(input.vaga_empresa).trim() }
        : {}),
    });
  } else {
    segmentacao = criarOuAtualizarSegmentacaoVaga({
      vaga_titulo,
      vaga_empresa: String(input?.vaga_empresa ?? "").trim() || null,
      vaga_descricao,
      vaga_url: vaga_url || null,
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
    estrutura: ESTRUTURA_SECOES_SOLIDES,
    segmentacao,
    segmentacao_id: segmentacao.id,
    segmento_slug,
    segmento_label: classificacao.segmento_label,
    scores: classificacao.scores,
    solides: pacote,
    preview,
    vaga_titulo,
    vaga_empresa: String(input?.vaga_empresa ?? "").trim() || segmentacao?.vaga_empresa || null,
    pacote_salvo: getPacoteSolides(segmentacao.id),
  };
}
