#!/usr/bin/env node
/**
 * CLI: adapta cv-base para segmento de busca (delega ao motor em site/lib).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const SITE_LIB = path.join(REPO_ROOT, "site", "lib");

function loadEnv() {
  const envPath = path.join(REPO_ROOT, "site", ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

async function main() {
  loadEnv();
  process.chdir(path.join(REPO_ROOT, "site"));

  const { adaptarCvParaBusca } = await import(pathToFileURL(path.join(SITE_LIB, "adaptarCvLocal.js")));

  const pedidoPath = path.join(REPO_ROOT, "dados", "curriculo", "pedido-adaptacao.json");
  const cvPath = path.join(REPO_ROOT, "dados", "cv-base.md");
  const outPath = path.join(REPO_ROOT, "dados", "curriculo", "adaptado-busca.md");

  const raw = JSON.parse(fs.readFileSync(pedidoPath, "utf8"));
  const pedido = raw.pedidos?.[0] ?? raw;
  const cvBase = fs.readFileSync(cvPath, "utf8");

  const conteudo = adaptarCvParaBusca(cvBase, pedido);

  fs.writeFileSync(outPath, conteudo, "utf8");
  console.log("adaptado-busca.md gerado");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
