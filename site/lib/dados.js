import fs from "fs";
import path from "path";
import { parse, stringify } from "yaml";
import { normalizarModalidades, normalizarSenioridades } from "./preferenciasBusca";

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
  return readYaml("config/tecnologias.yml");
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
  const titulos = Array.isArray(raw?.titulos_ativos)
    ? raw.titulos_ativos.filter(Boolean)
    : [];

  return {
    segmentos_ativos: inferirSegmentos(raw),
    titulos_ativos: titulos,
    senioridades: normalizarSenioridades(fonte),
    modalidades_trabalho: normalizarModalidades(fonte),
    modo_busca: fonte?.modo_busca ?? "focado",
    nota_minima: Number(fonte?.nota_minima ?? fonte?.nota_minima_candidatar ?? 4) || 4,
  };
}

export function saveBusca(busca) {
  const filePath = path.join(DADOS_ROOT, "config/busca.yml");
  const payload = {
    segmentos_ativos: (busca?.segmentos_ativos ?? []).filter(Boolean),
    titulos_ativos: (busca?.titulos_ativos ?? []).filter(Boolean),
    senioridades: busca?.senioridades ?? ["estagio"],
    modalidades_trabalho: busca?.modalidades_trabalho ?? ["remoto", "presencial", "hibrido"],
    modo_busca: busca?.modo_busca ?? "focado",
    nota_minima: Number(busca?.nota_minima ?? 4) || 4,
  };
  fs.writeFileSync(filePath, `${stringify(payload)}\n`, "utf8");
}

export function getCurriculoAtivo() {
  ensureDataFile("curriculo/ativo.yml", "curriculo/ativo.example.yml");
  return readYaml("curriculo/ativo.yml");
}

export function getRespostasPadrao() {
  ensureDataFile("respostas/padrao.yml", "respostas/padrao.example.yml");
  return readYaml("respostas/padrao.yml");
}

export function getComportamental() {
  ensureDataFile("respostas/comportamental.yml", "respostas/comportamental.example.yml");
  return readYaml("respostas/comportamental.yml");
}

export function getCvResumo() {
  ensureDataFile("cv-base.md", "cv-base.example.md");
  const raw = readText("cv-base.md");
  const match = raw.match(/## Resumo\s*\n+([\s\S]*?)(?=\n## )/);
  if (!match) return "";

  return match[1]
    .replace(/\*\*Áreas:\*\*[^\n]*/g, "")
    .replace(/\*\*Stack(\s*\([^)]*\))?:\*\*[^\n]*/g, "")
    .replace(/\*\*Ramificações:\*\*[^\n]*/g, "")
    .replace(/\*\*Foco:\*\*[^\n]*/g, "")
    .replace(/[^\n]*(?:fonte; versões por segmento|este arquivo é a fonte)[^\n]*/gi, "")
    .trim();
}

export function getCvBase() {
  ensureDataFile("cv-base.md", "cv-base.example.md");
  return readText("cv-base.md");
}

export function saveCvBase(content) {
  const filePath = path.join(DADOS_ROOT, "cv-base.md");
  fs.writeFileSync(filePath, String(content), "utf8");
}

const CURRICULO_PDF = "curriculo/principal.pdf";

export function getCurriculoPdfPath() {
  const filePath = path.join(DADOS_ROOT, CURRICULO_PDF);
  return fs.existsSync(filePath) ? filePath : null;
}

export function getCurriculoArquivo() {
  const filePath = getCurriculoPdfPath();
  if (!filePath) return null;

  const stat = fs.statSync(filePath);
  return {
    name: path.basename(filePath),
    size: stat.size,
    updatedAt: stat.mtime.toISOString(),
  };
}

export function saveCurriculoPdf(buffer) {
  const dir = path.join(DADOS_ROOT, "curriculo");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "principal.pdf"), buffer);
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
  const current = getTecnologias();
  fs.writeFileSync(filePath, `${stringify({ ...current, ...tecnologias })}\n`, "utf8");
}

export function saveCurriculoAtivo(ativo) {
  const filePath = path.join(DADOS_ROOT, "curriculo/ativo.yml");
  const current = getCurriculoAtivo();
  fs.writeFileSync(filePath, `${stringify({ ...current, ...ativo })}\n`, "utf8");
}

export function saveRespostasPadrao(respostas) {
  const filePath = path.join(DADOS_ROOT, "respostas/padrao.yml");
  const current = getRespostasPadrao();
  fs.writeFileSync(filePath, `${stringify({ ...current, ...respostas })}\n`, "utf8");
}

export function saveComportamental(data) {
  const filePath = path.join(DADOS_ROOT, "respostas/comportamental.yml");
  fs.writeFileSync(filePath, `${stringify(data)}\n`, "utf8");
}

export function saveCvResumo(resumo) {
  const filePath = path.join(DADOS_ROOT, "cv-base.md");
  const raw = readText("cv-base.md");
  const areasMatch = raw.match(/\*\*Áreas:\*\*([^\n]+)/);
  const stackMatch = raw.match(/\*\*Stack:\*\*([^\n]+)/);
  const focoMatch = raw.match(/\*\*Foco:\*\*([^\n]+)/);
  const areasLine = areasMatch ? `\n\n**Áreas:**${areasMatch[1]}` : "";
  const stackLine = stackMatch ? `\n\n**Stack:**${stackMatch[1]}` : "";
  const focoLine = focoMatch ? `\n\n**Foco:**${focoMatch[1]}` : "";
  const block = `## Resumo\n\n${String(resumo).trim()}${stackLine}${focoLine}${areasLine}\n\n`;
  const updated = raw.replace(/## Resumo\s*\n+[\s\S]*?(?=\n## )/, block);

  if (updated === raw) {
    throw new Error("Não foi possível atualizar a seção Resumo em cv-base.md");
  }

  fs.writeFileSync(filePath, updated, "utf8");
}

export function getPerfilCompleto() {
  return {
    profile: getProfile(),
    respostas: getRespostasPadrao(),
    resumo: getCvResumo(),
  };
}

export function savePerfilCompleto({ profile, respostas, resumo }) {
  if (profile) saveProfile(profile);
  if (respostas) saveRespostasPadrao(respostas);
  if (resumo !== undefined) saveCvResumo(resumo);
}

const CONTEUDO_BANCO = "conteudo/banco.yml";
const CONTEUDO_BANCO_EXAMPLE = "conteudo/banco.example.yml";

export function getConteudoBanco() {
  ensureDataFile(CONTEUDO_BANCO, CONTEUDO_BANCO_EXAMPLE);
  return readYaml(CONTEUDO_BANCO);
}

export function getCurriculoModelo() {
  const filePath = path.join(DADOS_ROOT, "curriculo/modelo.md");
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf8");
}

export function saveConteudoBanco(data) {
  const dir = path.join(DADOS_ROOT, "conteudo");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "banco.yml"), `${stringify(data)}\n`, "utf8");
}
