/**
 * Filtros da busca de vagas — espelha Segmentos (busca.yml).
 */

import { labelSenioridade } from "./senioridadeOpcoes.js";
import { localizacaoProxima } from "./localizacaoBusca.js";

/** Alias leve — evita puxar fonteCandidato/fs pro bundle do client. */
function resolverPerfilSlug(slug) {
  if (slug === "engenharia-software") return "desenvolvimento";
  return slug;
}

function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

const SENIOR_TERMOS = {
  estagio: ["estagio", "estagiario", "internship", "vacancy_type_internship"],
  trainee: ["trainee"],
  junior: ["junior", "jr", "jr.", "nivel i", "nível i"],
  pleno: ["pleno", "pl", "nivel ii", "nível ii"],
  senior: ["senior", "sr", "nivel iii", "nível iii"],
  especialista: ["especialista"],
  staff: ["staff"],
  "jovem-aprendiz": ["jovem aprendiz", "aprendiz"],
  "banco-de-talentos": ["banco de talentos", "talent pool", "vacancy_type_talent_pool"],
};

/** Níveis efetivos — banco de talentos NÃO cobre estes. */
const SENIOR_EFETIVO = new Set([
  "junior",
  "pleno",
  "senior",
  "especialista",
  "staff",
]);

const SENIOR_ALTO = new Set(["pleno", "senior", "especialista", "staff"]);

/** Níveis que banco-de-talentos ainda cobre. */
const SENIOR_BANCO_OK = new Set([
  "estagio",
  "trainee",
  "jovem-aprendiz",
  "banco-de-talentos",
]);

function hitCurto(texto, termo) {
  const tn = normalize(termo).trim();
  if (!tn) return false;
  if (tn.length <= 3) {
    const esc = tn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?:^|[^a-z0-9])${esc}(?:$|[^a-z0-9])`);
    return re.test(texto);
  }
  return texto.includes(tn);
}

function inferirNoBlob(blob) {
  const ordem = [
    "estagio",
    "jovem-aprendiz",
    "trainee",
    "junior",
    "pleno",
    "senior",
    "especialista",
    "staff",
    "banco-de-talentos",
  ];

  for (const slug of ordem) {
    const termos = SENIOR_TERMOS[slug] ?? [labelSenioridade(slug)];
    if (termos.some((t) => hitCurto(blob, t))) return slug;
  }
  return null;
}

/** Infere senioridade — título/tipo pesam mais que a descrição. */
export function inferirSenioridadeVaga(vaga) {
  const tituloTipo = normalize(`${vaga?.titulo ?? ""} ${vaga?.tipo ?? ""}`);
  const noTitulo = inferirNoBlob(tituloTipo);
  if (noTitulo) return noTitulo;

  const desc = normalize(String(vaga?.descricao ?? "").slice(0, 2000));
  return inferirNoBlob(desc);
}

export function modalidadeBate(modalidadeVaga, modalidadesBusca) {
  const mods = modalidadesBusca ?? [];
  if (!mods.length) return true;
  const m = normalize(modalidadeVaga ?? "");
  if (!m) return true;

  const mapa = {
    remoto: ["remote", "remoto", "home office"],
    hibrido: ["hybrid", "hibrido", "híbrido"],
    presencial: ["on-site", "onsite", "presencial", "on_site"],
  };

  return mods.some((slug) => (mapa[slug] ?? [slug]).some((t) => m.includes(normalize(t))));
}

export function senioridadeBate(vaga, senioridadesBusca) {
  const pedidas = senioridadesBusca?.length ? senioridadesBusca : ["estagio"];
  const inferida = inferirSenioridadeVaga(vaga);

  if (!inferida) {
    return { ok: true, inferida: null, motivo: null };
  }

  if (pedidas.includes(inferida)) {
    return { ok: true, inferida, motivo: null };
  }

  // Banco de talentos: só estágio/trainee/aprendiz — NÃO júnior/pleno/sênior
  if (pedidas.includes("banco-de-talentos") && SENIOR_BANCO_OK.has(inferida)) {
    return { ok: true, inferida, motivo: null };
  }

  if (SENIOR_EFETIVO.has(inferida) && !pedidas.includes(inferida)) {
    return { ok: false, inferida, motivo: "senioridade" };
  }

  if (SENIOR_ALTO.has(inferida) && !pedidas.some((s) => SENIOR_ALTO.has(s))) {
    return { ok: false, inferida, motivo: "senioridade" };
  }

  return { ok: false, inferida, motivo: "senioridade" };
}

export function segmentoBate(segmentoSlug, segmentosAtivos) {
  const ativos = (segmentosAtivos ?? []).map(resolverPerfilSlug);
  if (!ativos.length) return true;
  if (!segmentoSlug) return true;
  const key = resolverPerfilSlug(segmentoSlug);
  if (key === "desenvolvimento" && ativos.includes("engenharia-software")) return true;
  if (key === "engenharia-software" && ativos.includes("desenvolvimento")) return true;
  return ativos.includes(key);
}

/**
 * Decide se a vaga entra na lista filtrada.
 * modo: focado (estrito) | hibrido | amplo
 */
export function passaFiltroBusca(vaga, score, busca, profile = null) {
  const modo = busca?.modo_busca ?? "focado";
  const motivos = [];

  const loc = localizacaoProxima(vaga, profile ?? {});
  if (!loc.ok) {
    if (modo !== "amplo") {
      return {
        passa: false,
        motivos: ["localizacao"],
        senioridade_inferida: null,
      };
    }
    motivos.push("localizacao?");
  }

  const modOk = modalidadeBate(vaga?.modalidade, busca?.modalidades_trabalho);
  if (!modOk) {
    if (modo !== "amplo") {
      return { passa: false, motivos: ["modalidade"] };
    }
    motivos.push("modalidade?");
  }

  const sen = senioridadeBate(vaga, busca?.senioridades);
  if (!sen.ok) {
    if (modo === "focado" || modo === "hibrido") {
      return {
        passa: false,
        motivos: ["senioridade"],
        senioridade_inferida: sen.inferida,
      };
    }
    motivos.push("senioridade?");
  }

  const segOk = segmentoBate(score?.segmento_sugerido, busca?.segmentos_ativos);
  if (!segOk) {
    if (modo === "focado") {
      return {
        passa: false,
        motivos: ["segmento"],
        senioridade_inferida: sen.inferida,
      };
    }
    motivos.push("segmento?");
  }

  return {
    passa: true,
    motivos,
    senioridade_inferida: sen.inferida,
  };
}
