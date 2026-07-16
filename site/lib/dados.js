import fs from "fs";
import path from "path";
import { parse, stringify } from "yaml";
import { normalizarModalidades, normalizarSenioridades } from "./preferenciasBusca.js";
import { filtrarChavesTituloPorSenioridade } from "./tituloSenioridade.js";
import { normalizarTecnologias } from "./tecnologiasCampos.js";

const DADOS_ROOT = path.join(process.cwd(), "..", "dados");

function ensureDataFile(relativePath, exampleRelativePath) {
  const filePath = path.join(DADOS_ROOT, relativePath);
  if (fs.existsSync(filePath)) return filePath;

  const examplePath = path.join(DADOS_ROOT, exampleRelativePath);
  if (!fs.existsSync(examplePath)) {
    throw new Error(`Arquivo ${exampleRelativePath} não encontrado em dados/`);
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.copyFileSync(examplePath, filePath);
  return filePath;
}

function readYaml(relativePath) {
  const filePath = path.join(DADOS_ROOT, relativePath);
  const raw = fs.readFileSync(filePath, "utf8");
  return parse(raw);
}

function readText(relativePath) {
  const filePath = path.join(DADOS_ROOT, relativePath);
  return fs.readFileSync(filePath, "utf8");
}

export function getProfile() {
  ensureDataFile("config/profile.yml", "config/profile.example.yml");
  return readYaml("config/profile.yml");
}

export function getFormacao() {
  ensureDataFile("config/formacao.yml", "config/formacao.example.yml");
  return readYaml("config/formacao.yml");
}

export function getTecnologias() {
  ensureDataFile("config/tecnologias.yml", "config/tecnologias.example.yml");
  return normalizarTecnologias(readYaml("config/tecnologias.yml"));
}

export function getBusca() {
  ensureDataFile("config/busca.yml", "config/busca.example.yml");
  const raw = readYaml("config/busca.yml");
  let profile = null;
  try {
    profile = readYaml("config/profile.yml");
  } catch {
    profile = null;
  }
  return normalizarBusca(raw, profile);
}

function inferirSegmentos(raw) {
  if (Array.isArray(raw?.segmentos_ativos) && raw.segmentos_ativos.length) {
    return raw.segmentos_ativos.filter(Boolean);
  }
  const slugs = new Set();
  for (const chave of raw?.titulos_ativos ?? []) {
    const slug = String(chave).split("/")[0];
    if (slug) slugs.add(slug);
  }
  return [...slugs];
}

function normalizarBusca(raw, profileFallback = null) {
  const fonte = { ...profileFallback, ...raw };
  const senioridades = normalizarSenioridades(fonte);
  const titulos = filtrarChavesTituloPorSenioridade(
    Array.isArray(raw?.titulos_ativos) ? raw.titulos_ativos.filter(Boolean) : [],
    senioridades,
  );

  return {
    segmentos_ativos: inferirSegmentos({ ...raw, titulos_ativos: titulos }),
    titulos_ativos: titulos,
    senioridades,
    modalidades_trabalho: normalizarModalidades(fonte),
    modo_busca: fonte?.modo_busca ?? "focado",
    nota_minima: Number(fonte?.nota_minima ?? fonte?.nota_minima_candidatar ?? 4) || 4,
  };
}

export function saveBusca(busca) {
  const filePath = path.join(DADOS_ROOT, "config/busca.yml");
  const senioridades = busca?.senioridades ?? ["estagio"];
  const payload = {
    segmentos_ativos: (busca?.segmentos_ativos ?? []).filter(Boolean),
    titulos_ativos: filtrarChavesTituloPorSenioridade(
      busca?.titulos_ativos ?? [],
      senioridades,
    ),
    senioridades,
    modalidades_trabalho: busca?.modalidades_trabalho ?? ["remoto", "presencial", "hibrido"],
    modo_busca: busca?.modo_busca ?? "focado",
    nota_minima: Number(busca?.nota_minima ?? 4) || 4,
  };
  fs.writeFileSync(filePath, `${stringify(payload)}\n`, "utf8");
}

export function getRespostasPadrao() {
  ensureDataFile("respostas/padrao.yml", "respostas/padrao.example.yml");
  return readYaml("respostas/padrao.yml");
}

export function getCvBase() {
  ensureDataFile("cv-base.md", "cv-base.example.md");
  return readText("cv-base.md");
}

export function saveCvBase(content) {
  const filePath = path.join(DADOS_ROOT, "cv-base.md");
  fs.writeFileSync(filePath, String(content), "utf8");
}

export function getProfilePhotoPath() {
  const dir = path.join(DADOS_ROOT, "fotos");
  if (!fs.existsSync(dir)) return null;

  const photo = fs
    .readdirSync(dir)
    .find((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));

  return photo ? path.join(dir, photo) : null;
}

export function saveProfile(profile) {
  const filePath = path.join(DADOS_ROOT, "config/profile.yml");
  const current = getProfile();
  fs.writeFileSync(filePath, `${stringify({ ...current, ...profile })}\n`, "utf8");
}

export function saveFormacao(formacao) {
  const filePath = path.join(DADOS_ROOT, "config/formacao.yml");
  const current = getFormacao();
  fs.writeFileSync(filePath, `${stringify({ ...current, ...formacao })}\n`, "utf8");
}

export function saveTecnologias(tecnologias) {
  const filePath = path.join(DADOS_ROOT, "config/tecnologias.yml");
  const payload = normalizarTecnologias(tecnologias);
  fs.writeFileSync(filePath, `${stringify(payload)}\n`, "utf8");
}

export function saveRespostasPadrao(respostas) {
  const filePath = path.join(DADOS_ROOT, "respostas/padrao.yml");
  const current = getRespostasPadrao();
  fs.writeFileSync(filePath, `${stringify({ ...current, ...respostas })}\n`, "utf8");
}

const CONTEUDO_BANCO = "conteudo/banco.yml";
const CONTEUDO_BANCO_EXAMPLE = "conteudo/banco.example.yml";
const CONTEUDO_ATIVIDADES = "conteudo/atividades.yml";
const CONTEUDO_ATIVIDADES_EXAMPLE = "conteudo/atividades.example.yml";

export function getConteudoBanco() {
  ensureDataFile(CONTEUDO_BANCO, CONTEUDO_BANCO_EXAMPLE);
  return readYaml(CONTEUDO_BANCO);
}

export function getConteudoAtividades() {
  ensureDataFile(CONTEUDO_ATIVIDADES, CONTEUDO_ATIVIDADES_EXAMPLE);
  return readYaml(CONTEUDO_ATIVIDADES);
}

export function saveConteudoBanco(data) {
  const dir = path.join(DADOS_ROOT, "conteudo");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "banco.yml"), `${stringify(data)}\n`, "utf8");
}

export function getPortalSolides() {
  ensureDataFile("portais/solides.yml", "portais/solides.example.yml");
  return readYaml("portais/solides.yml");
}

export function getPortalGupy() {
  ensureDataFile("portais/gupy.yml", "portais/gupy.example.yml");
  return readYaml("portais/gupy.yml");
}

/** Overrides de campos do molde (Sólides / Gupy) editados no Currículo. */
export function getPortalCampos(portalId) {
  const id = String(portalId ?? "").toLowerCase();
  let data = null;
  try {
    if (id === "solides") data = getPortalSolides();
    else if (id === "gupy") data = getPortalGupy();
  } catch {
    return {};
  }
  const campos = data?.campos;
  if (!campos || typeof campos !== "object" || Array.isArray(campos)) return {};
  const out = {};
  for (const [k, v] of Object.entries(campos)) {
    if (v == null || typeof v === "object") continue;
    out[k] = String(v);
  }
  return out;
}

function textoCampoBase(v) {
  if (v == null) return "";
  if (Array.isArray(v)) {
    return v
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.nome && item?.nivel) return `${item.nome} (${item.nivel})`;
        if (item?.idioma && item?.nivel) return `${item.idioma} (${item.nivel})`;
        return "";
      })
      .filter(Boolean)
      .join("; ");
  }
  return String(v);
}

/**
 * Salva só campos que diferem da base automática (evita gravar tudo vazio).
 * @param {string} portalId
 * @param {Record<string, string>} campos
 * @param {Record<string, unknown>} [baseValores]
 */
export function savePortalCampos(portalId, campos, baseValores = null) {
  const id = String(portalId ?? "").toLowerCase();
  const clean = {};
  for (const [k, v] of Object.entries(campos ?? {})) {
    if (v == null || typeof v === "object") continue;
    const str = String(v);
    if (baseValores) {
      if (str === textoCampoBase(baseValores[k])) continue;
    } else if (!str.trim()) {
      continue;
    }
    clean[k] = str;
  }

  if (id === "solides") {
    const filePath = path.join(DADOS_ROOT, "portais/solides.yml");
    const current = getPortalSolides() ?? {};
    fs.writeFileSync(filePath, `${stringify({ ...current, campos: clean })}\n`, "utf8");
    return getPortalCampos("solides");
  }

  if (id === "gupy") {
    const filePath = path.join(DADOS_ROOT, "portais/gupy.yml");
    const current = getPortalGupy() ?? {};
    fs.writeFileSync(
      filePath,
      `${stringify({ ...current, portal: "gupy", campos: clean })}\n`,
      "utf8",
    );
    return getPortalCampos("gupy");
  }

  throw new Error(`Portal sem edição de campos: ${portalId}`);
}
