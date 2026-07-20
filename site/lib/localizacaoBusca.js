/**
 * Localização na busca — usa cidade/estado do perfil.
 * Presencial/híbrido: região próxima. Remoto: Brasil todo.
 */

import { normalizarTexto } from "./buscaBusca.js";

const UF_PARA_SLUG = {
  ac: "acre",
  al: "alagoas",
  ap: "amapa",
  am: "amazonas",
  ba: "bahia",
  ce: "ceara",
  df: "distrito federal",
  es: "espirito santo",
  go: "goias",
  ma: "maranhao",
  mt: "mato grosso",
  ms: "mato grosso do sul",
  mg: "minas gerais",
  pa: "para",
  pb: "paraiba",
  pr: "parana",
  pe: "pernambuco",
  pi: "piaui",
  rj: "rio de janeiro",
  rn: "rio grande do norte",
  rs: "rio grande do sul",
  ro: "rondonia",
  rr: "roraima",
  sc: "santa catarina",
  sp: "sao paulo",
  se: "sergipe",
  to: "tocantins",
};

const NOME_PARA_UF = Object.fromEntries(
  Object.entries(UF_PARA_SLUG).map(([uf, nome]) => [nome, uf]),
);

/** Cidades com deslocamento plausível a partir da chave (cidade normalizada). */
const REGIAO_PERTO = {
  "santo andre": [
    "santo andre",
    "sao bernardo do campo",
    "sao caetano do sul",
    "diadema",
    "maua",
    "ribeirao pires",
    "rio grande da serra",
    "sao paulo",
    "osasco",
    "guarulhos",
    "barueri",
    "taboao da serra",
    "embu das artes",
    "carapicuiba",
  ],
  "sao paulo": [
    "sao paulo",
    "osasco",
    "guarulhos",
    "barueri",
    "santo andre",
    "sao bernardo do campo",
    "sao caetano do sul",
    "diadema",
    "maua",
    "taboao da serra",
    "embu das artes",
    "carapicuiba",
  ],
};

export function slugEstado(estado) {
  const raw = normalizarTexto(estado);
  if (!raw) return "";
  if (raw.length === 2 && UF_PARA_SLUG[raw]) return raw;
  if (NOME_PARA_UF[raw]) return NOME_PARA_UF[raw];
  // só match exato do nome completo — evita "parana".includes("para") → PA
  return "";
}

function cidadeBate(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  // evita "serra" ⊆ "rio grande da serra" com tokens curtos demais
  if (a.length >= 5 && b.length >= 5 && (a.includes(b) || b.includes(a))) return true;
  return false;
}

function cidadeNaRegiao(cidadeVaga, cidadePerfil) {
  if (!cidadeVaga || !cidadePerfil) return false;
  const regiao = REGIAO_PERTO[cidadePerfil] ?? [cidadePerfil];
  return regiao.some((c) => cidadeBate(cidadeVaga, c));
}

export function localDoPerfil(profile = {}) {
  const cidade = normalizarTexto(profile.cidade);
  const estado = slugEstado(profile.estado);
  const label =
    profile.cidade && profile.estado
      ? `${profile.cidade}, ${profile.estado}`
      : profile.cidade || profile.estado || null;
  return { cidade, estado, label };
}

export function estadoParaConsultaGupy(profile = {}) {
  const { estado } = localDoPerfil(profile);
  if (estado === "sp") return "São Paulo";
  if (estado === "rj") return "Rio de Janeiro";
  if (estado === "mg") return "Minas Gerais";
  const nome = UF_PARA_SLUG[estado];
  if (!nome) return null;
  return nome
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function vagaEhRemota(vaga = {}) {
  if (vaga.modalidade === "remoto") return true;
  const blob = normalizarTexto(
    `${vaga.titulo ?? ""} ${vaga.descricao ?? ""} ${vaga.tipo ?? ""}`.slice(0, 2500),
  );
  return /\b(remoto|home office|100%?\s*remoto|trabalho remoto|anywhere|teletrabalho)\b/.test(
    blob,
  );
}

/**
 * Presencial/híbrido: perto do perfil.
 * Remoto: Brasil todo.
 * Sem cidade/estado na vaga presencial: não passa (evita POA “escondido”).
 */
export function localizacaoProxima(vaga = {}, profile = {}) {
  if (vagaEhRemota(vaga)) {
    return { ok: true, motivo: "remoto" };
  }

  const perfil = localDoPerfil(profile);
  if (!perfil.cidade && !perfil.estado) {
    return { ok: true, motivo: "sem_perfil" };
  }

  const cidadeVaga = normalizarTexto(vaga.cidade);
  const estadoVaga = slugEstado(vaga.estado);

  if (!cidadeVaga && !estadoVaga) {
    return { ok: false, motivo: "sem_local_vaga" };
  }

  if (estadoVaga && perfil.estado && estadoVaga !== perfil.estado) {
    return { ok: false, motivo: "outro_estado" };
  }

  if (cidadeVaga && cidadeBate(cidadeVaga, perfil.cidade)) {
    return { ok: true, motivo: "mesma_cidade" };
  }

  if (cidadeVaga && cidadeNaRegiao(cidadeVaga, perfil.cidade)) {
    return { ok: true, motivo: "regiao" };
  }

  if (cidadeVaga) {
    return { ok: false, motivo: "longe" };
  }

  // só estado, sem cidade: aceita se for o mesmo UF do perfil
  if (estadoVaga && perfil.estado && estadoVaga === perfil.estado) {
    return { ok: true, motivo: "mesmo_estado" };
  }

  return { ok: false, motivo: "longe" };
}

export function resumoLocalBusca(profile = {}) {
  const { label } = localDoPerfil(profile);
  if (!label) return "Defina cidade no Perfil";
  return `Perto de ${label} · remoto = Brasil`;
}

/** Rótulo curto na UI — ex.: (SP) */
export function rotuloLocalCurto(profile = {}) {
  const uf = String(profile.estado ?? "").trim();
  if (uf) return `(${uf.toUpperCase()})`;
  const { cidade } = localDoPerfil(profile);
  if (profile.cidade) return `(${profile.cidade})`;
  if (cidade) return `(${cidade})`;
  return null;
}
