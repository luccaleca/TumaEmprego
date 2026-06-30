import fs from "fs";
import path from "path";
import { parse, stringify } from "yaml";

const DADOS_ROOT = path.join(process.cwd(), "..", "dados");

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
  return readYaml("config/profile.yml");
}

export function getFormacao() {
  return readYaml("config/formacao.yml");
}

export function getTecnologias() {
  return readYaml("config/tecnologias.yml");
}

export function getCurriculoAtivo() {
  return readYaml("curriculo/ativo.yml");
}

export function getRespostasPadrao() {
  return readYaml("respostas/padrao.yml");
}

export function getComportamental() {
  return readYaml("respostas/comportamental.yml");
}

export function getCvResumo() {
  const raw = readText("cv-base.md");
  const match = raw.match(/## Resumo\s*\n+([\s\S]*?)(?=\n## )/);
  if (!match) return "";

  return match[1]
    .replace(/\*\*Áreas:\*\*[^\n]*/g, "")
    .trim();
}

export function getCvBase() {
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
  const areasLine = areasMatch ? `\n\n**Áreas:**${areasMatch[1]}` : "";
  const block = `## Resumo\n\n${String(resumo).trim()}${areasLine}\n\n`;
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
