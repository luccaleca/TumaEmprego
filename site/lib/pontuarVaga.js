/**
 * Nota 1.0–5.0 de aderência JD × perfil (regras locais, sem inventar fatos).
 */

import { getFonteCandidato, termosTecnologiaCandidato } from "./fonteCandidato.js";
import { scoreSegmentosPorVaga } from "./perfilCvSegmento.js";
import { labelSenioridade } from "./senioridadeOpcoes.js";
import { listarTitulosAtivos } from "./vagaCatalogo.js";

function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function stripHtml(html) {
  return String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const SENIOR_NO_TEXTO = {
  estagio: ["estagio", "estagiario", "internship"],
  trainee: ["trainee"],
  junior: ["junior", "júnior", " jr ", "jr.", " jr)", "(jr", "nivel i", "nível i"],
  pleno: ["pleno", " pl ", " pl)", "(pl ", "nivel ii", "nível ii"],
  senior: ["senior", "sênior", " sr ", "sr.", " sr)", "(sr", " sr", "nivel iii"],
  "jovem-aprendiz": ["aprendiz", "jovem aprendiz"],
  "banco-de-talentos": ["banco de talentos", "talent pool"],
};

const SENIOR_ALTO = new Set(["pleno", "senior", "especialista", "staff"]);

function contarHits(textoNorm, termos) {
  let n = 0;
  for (const t of termos ?? []) {
    const tn = normalize(t).trim();
    if (tn.length < 2) continue;
    if (tn.length <= 3) {
      // tokens curtos (jr, pl, sr): borda de palavra
      const re = new RegExp(`(?:^|[^a-z0-9])${tn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[^a-z0-9])`);
      if (re.test(textoNorm)) n += 1;
    } else if (textoNorm.includes(tn)) {
      n += 1;
    }
  }
  return n;
}

function tituloAlvoCurto(chaveOuTitulo) {
  const s = String(chaveOuTitulo ?? "");
  const partes = s.split("/");
  return partes[partes.length - 1] || s;
}

/**
 * @param {{ titulo?: string, descricao?: string, empresa?: string, modalidade?: string, tipo?: string }} vaga
 * @param {{ busca?: object, catalogo?: array, fonte?: object }} opts
 */
export function pontuarVaga(vaga, opts = {}) {
  const fonte = opts.fonte ?? getFonteCandidato();
  const busca = opts.busca ?? fonte.busca ?? {};
  const catalogo = opts.catalogo ?? [];

  const titulo = String(vaga?.titulo ?? "");
  const descricao = stripHtml(vaga?.descricao ?? "");
  const blob = normalize(`${titulo}\n${descricao}`);
  const tituloNorm = normalize(titulo);

  const alvos = listarTitulosAtivos(catalogo, busca.titulos_ativos ?? []).map((a) => a.titulo);
  const titulosBusca =
    alvos.length > 0
      ? alvos
      : (busca.titulos_ativos ?? []).map(tituloAlvoCurto).filter(Boolean);

  let pontos = 0;
  const motivos = [];

  const hitsTitulo = contarHits(tituloNorm, titulosBusca);
  if (hitsTitulo > 0) {
    pontos += Math.min(3, hitsTitulo) * 1.2;
    motivos.push(`cargo (${hitsTitulo})`);
  } else if (titulosBusca.length) {
    const palavrasAlvo = titulosBusca
      .flatMap((t) => normalize(t).split(/\s+/))
      .filter((w) => w.length > 3);
    const hitsPalavra = contarHits(tituloNorm, [...new Set(palavrasAlvo)]);
    if (hitsPalavra > 0) {
      pontos += Math.min(2, hitsPalavra) * 0.6;
      motivos.push(`palavras do cargo (${hitsPalavra})`);
    }
  }

  const techs = termosTecnologiaCandidato(fonte);
  const hitsTech = contarHits(blob, techs);
  if (hitsTech > 0) {
    pontos += Math.min(6, hitsTech) * 0.45;
    motivos.push(`tech (${hitsTech})`);
  }

  const ranked = scoreSegmentosPorVaga(titulo, descricao, fonte);
  const topSeg = ranked[0];
  if (topSeg?.score > 0) {
    pontos += Math.min(4, topSeg.score * 0.35);
    motivos.push(topSeg.label);
  }

  const senioridades = busca.senioridades?.length ? busca.senioridades : ["estagio"];
  const buscaIncluiAlto = senioridades.some((s) => SENIOR_ALTO.has(s));
  const buscaSoEntrada = senioridades.every((s) =>
    ["estagio", "trainee", "jovem-aprendiz", "junior", "banco-de-talentos"].includes(s),
  );

  const pareceAlto = [...SENIOR_ALTO].some((s) =>
    contarHits(tituloNorm, SENIOR_NO_TEXTO[s] ?? [s]),
  );

  let seniorOk = false;
  for (const slug of senioridades) {
    if (pareceAlto && !buscaIncluiAlto && SENIOR_ALTO.has(slug) === false) {
      // título sênior/pleno não conta como ok só por banco de talentos
      if (slug === "banco-de-talentos") continue;
    }
    const termos = SENIOR_NO_TEXTO[slug] ?? [labelSenioridade(slug).toLowerCase()];
    if (contarHits(blob, termos) > 0 || contarHits(normalize(vaga?.tipo ?? ""), termos) > 0) {
      seniorOk = true;
      break;
    }
    if (slug === "estagio" && /internship|vacancy_type_internship/i.test(String(vaga?.tipo ?? ""))) {
      seniorOk = true;
      break;
    }
    if (
      slug === "banco-de-talentos" &&
      !pareceAlto &&
      /talent_pool/i.test(String(vaga?.tipo ?? ""))
    ) {
      seniorOk = true;
      break;
    }
  }

  if (seniorOk) {
    pontos += 1.1;
    motivos.push("senioridade");
  }

  if (pareceAlto && buscaSoEntrada) {
    pontos = Math.min(pontos, 1.0);
    motivos.push("acima do nível");
  }

  const modalidades = busca.modalidades_trabalho ?? [];
  const modVaga = normalize(vaga?.modalidade ?? "");
  if (modalidades.length && modVaga) {
    const mapa = {
      remoto: ["remote", "remoto", "home office"],
      hibrido: ["hybrid", "hibrido", "híbrido"],
      presencial: ["on-site", "onsite", "presencial", "on_site"],
    };
    const bate = modalidades.some((m) => (mapa[m] ?? [m]).some((t) => modVaga.includes(normalize(t))));
    if (bate) {
      pontos += 0.4;
      motivos.push("modalidade");
    }
  }

  // Escala empírica → 1.0–5.0
  let nota = 1 + Math.min(4, pontos * 0.55);
  nota = Math.round(nota * 10) / 10;
  if (nota < 1) nota = 1;
  if (nota > 5) nota = 5;

  const notaMinima = Number(busca.nota_minima ?? 4) || 4;

  return {
    nota,
    nota_minima: notaMinima,
    elegivel: nota >= notaMinima,
    pontos: Math.round(pontos * 10) / 10,
    motivos,
    segmento_sugerido: topSeg?.slug ?? null,
    segmento_label: topSeg?.label ?? null,
  };
}

export function limparDescricaoHtml(html) {
  return stripHtml(html);
}
