/**
 * Orquestra busca de vagas (Gupy + pontuação) a partir de busca.yml.
 */

import fs from "fs";
import path from "path";
import { stringify, parse } from "yaml";
import { getBusca, getProfile } from "./dados.js";
import { getFonteCandidato } from "./fonteCandidato.js";
import { getVagaCatalogo, listarTitulosAtivos } from "./vagaCatalogo.js";
import { limparDescricaoHtml, pontuarVaga } from "./pontuarVaga.js";
import { passaFiltroBusca } from "./filtrarVagaBusca.js";
import {
  PORTAIS_BUSCA_IDS,
  coletarVagasPortais,
  montarContextoBusca,
} from "./buscaPortais.js";
import { LABELS_SEGMENTO } from "./conteudoConstants.js";
import { labelSenioridade } from "./senioridadeOpcoes.js";
import { LABEL_MODALIDADE, LABEL_MODO } from "./buscaOpcoes.js";
import { localDoPerfil, resumoLocalBusca } from "./localizacaoBusca.js";

const DADOS_ROOT = path.join(process.cwd(), "..", "dados");
const RESULTADO_PATH = path.join(DADOS_ROOT, "busca", "ultima.yml");

function ensureDir() {
  fs.mkdirSync(path.dirname(RESULTADO_PATH), { recursive: true });
}

function normalizarUrl(url) {
  try {
    const u = new URL(String(url));
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return String(url ?? "").trim();
  }
}

/**
 * @param {{ portais?: string[], maxPorConsulta?: number, soElegiveis?: boolean }} opts
 */
export async function executarBuscaVagas(opts = {}) {
  const busca = getBusca();
  const profile = getProfile();
  const catalogo = await getVagaCatalogo();
  const fonte = getFonteCandidato();

  const titulosPorSegmento = listarTitulosAtivos(catalogo, busca.titulos_ativos ?? []);
  let titulos = titulosPorSegmento.map((t) => t.titulo);

  // Em modo focado: só cargos dos segmentos ativos
  const segmentosAtivos = (busca.segmentos_ativos ?? []).filter(Boolean);
  if (segmentosAtivos.length && titulosPorSegmento.length) {
    const setSeg = new Set(segmentosAtivos);
    const filtrados = titulosPorSegmento
      .filter((t) => setSeg.has(String(t.chave).split("/")[0]))
      .map((t) => t.titulo);
    if (filtrados.length) titulos = filtrados;
  }

  if (!titulos.length && !(busca.titulos_ativos ?? []).length) {
    throw new Error("Defina cargos em Segmentos antes de buscar.");
  }

  const titulosConsulta = titulos.length
    ? titulos
    : (busca.titulos_ativos ?? []).map((c) => String(c).split("/").pop()).filter(Boolean);

  const titulosLimpos = titulosConsulta
    .map((t) => String(t).replace(/\s+/g, " ").trim())
    .filter((t) => t.length >= 3 && t.length <= 80 && !/[ÃÂ]{2,}/.test(t));

  const portais = (opts.portais?.length ? opts.portais : PORTAIS_BUSCA_IDS).filter((id) =>
    PORTAIS_BUSCA_IDS.includes(id),
  );
  const maxPorConsulta = Math.min(Number(opts.maxPorConsulta) || 12, 30);
  const ctx = montarContextoBusca({ busca, profile, maxPorConsulta });

  const { brutas, avisos, erros, consultas } = await coletarVagasPortais(
    portais,
    ctx,
    titulosLimpos,
    busca.senioridades,
  );

  const porUrl = new Map();
  for (const v of brutas) {
    const key = normalizarUrl(v.url);
    if (!key) continue;
    if (!porUrl.has(key)) porUrl.set(key, v);
  }

  let filtradasFora = 0;
  const pontuadas = [];

  for (const v of porUrl.values()) {
    const descricao = limparDescricaoHtml(v.descricao);
    const score = pontuarVaga(
      {
        titulo: v.titulo,
        descricao,
        empresa: v.empresa,
        modalidade: v.modalidade,
        tipo: v.tipo,
      },
      { busca, catalogo, fonte },
    );

    const filtro = passaFiltroBusca(
      { ...v, descricao },
      score,
      busca,
      profile,
    );

    if (!filtro.passa) {
      filtradasFora += 1;
      continue;
    }

    pontuadas.push({
      id: v.id,
      portal: v.portal,
      titulo: v.titulo,
      empresa: v.empresa,
      url: v.url,
      cidade: v.cidade || "",
      estado: v.estado || "",
      modalidade: v.modalidade || "",
      tipo: v.tipo || "",
      publicado_em: v.publicado_em,
      consulta: v.consulta || "",
      descricao: descricao.slice(0, 8000),
      nota: score.nota,
      elegivel: score.elegivel,
      motivos: score.motivos,
      segmento_sugerido: score.segmento_sugerido,
      segmento_label: score.segmento_label,
      senioridade_inferida: filtro.senioridade_inferida,
    });
  }

  pontuadas.sort((a, b) => b.nota - a.nota || String(a.titulo).localeCompare(String(b.titulo)));

  const soElegiveis = Boolean(opts.soElegiveis);
  const lista = soElegiveis ? pontuadas.filter((v) => v.elegivel) : pontuadas;

  const filtros = {
    segmentos_ativos: segmentosAtivos,
    segmentos_labels: segmentosAtivos.map((s) => LABELS_SEGMENTO[s] ?? s),
    senioridades: busca.senioridades ?? [],
    senioridades_labels: (busca.senioridades ?? []).map(labelSenioridade),
    modalidades_trabalho: busca.modalidades_trabalho ?? [],
    modalidades_labels: (busca.modalidades_trabalho ?? []).map(
      (m) => LABEL_MODALIDADE[m] ?? m,
    ),
    modo_busca: busca.modo_busca ?? "focado",
    modo_label: LABEL_MODO[busca.modo_busca] ?? busca.modo_busca,
    nota_minima: Number(busca.nota_minima) || 4,
    titulos_consulta: titulosLimpos.slice(0, 12),
    local_perfil: localDoPerfil(profile),
    local_resumo: resumoLocalBusca(profile),
  };

  const relatorio = {
    gerado_em: new Date().toISOString(),
    nota_minima: filtros.nota_minima,
    filtros,
    consultas,
    portais,
    total_brutas: porUrl.size,
    total_filtradas_fora: filtradasFora,
    total_coletadas: pontuadas.length,
    total_elegiveis: pontuadas.filter((v) => v.elegivel).length,
    avisos,
    erros,
    vagas: lista,
  };

  salvarRelatorioBusca(relatorio);
  return relatorio;
}

export function salvarRelatorioBusca(relatorio) {
  ensureDir();
  fs.writeFileSync(RESULTADO_PATH, `${stringify(relatorio)}\n`, "utf8");
}

export function lerRelatorioBusca() {
  if (!fs.existsSync(RESULTADO_PATH)) return null;
  try {
    return parse(fs.readFileSync(RESULTADO_PATH, "utf8"));
  } catch {
    return null;
  }
}

export { RESULTADO_PATH };
