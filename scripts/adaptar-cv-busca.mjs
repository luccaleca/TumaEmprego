#!/usr/bin/env node
/**
 * Adapta cv-base.md para a busca salva.
 * Com CURSOR_API_KEY: usa @cursor/sdk (Agent.prompt).
 * Sem chave: fallback local (resumo + áreas).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const DADOS = path.join(REPO_ROOT, "dados");

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

function fallbackAdaptacao(cvBase, pedido) {
  const titulos = [...new Set(pedido.alvos?.map((a) => a.titulo) ?? [])];
  const senioridades =
    pedido.alvos?.map((a) => a.senioridade).filter(Boolean).join(", ") || "estágio";
  const areas = titulos.slice(0, 4).join(", ") || "análise de dados";

  const resumoNovo = `Estudante de Sistemas de Informação com experiência em SQL, Python, Power BI e análise de dados aplicada a negócio. Busco oportunidade como ${senioridades} em ${areas}, com foco em extração de dados, dashboards e insights para decisão.`;

  const areasLine = `**Áreas:** ${titulos.slice(0, 5).join(" · ")}`;

  let out = cvBase;
  if (out.match(/## Resumo\s*\n+[\s\S]*?(?=\n## )/)) {
    out = out.replace(
      /## Resumo\s*\n+[\s\S]*?(?=\n## )/,
      `## Resumo\n\n${resumoNovo}\n\n${areasLine}\n\n`,
    );
  }

  const header = `<!-- Gerado em ${new Date().toISOString()} — fallback local. Para adaptação completa via Cursor, defina CURSOR_API_KEY em site/.env -->\n\n`;
  return header + out;
}

async function adaptarComCursor(prompt, cvBase) {
  const sdkPath = path.join(REPO_ROOT, "site", "node_modules", "@cursor", "sdk");
  if (!fs.existsSync(sdkPath)) {
    throw new Error("@cursor/sdk não instalado em site/");
  }
  const { Agent } = await import(path.join(sdkPath, "dist", "index.js"));
  const result = await Agent.prompt(
    `${prompt}\n\n---\n\nCV BASE ATUAL:\n\n${cvBase}`,
    {
      apiKey: process.env.CURSOR_API_KEY,
      model: { id: "composer-2.5" },
      local: { cwd: REPO_ROOT },
    },
  );
  return result?.result ?? result?.output ?? "";
}

async function main() {
  loadEnv();

  const pedidoPath = path.join(DADOS, "curriculo", "pedido-adaptacao.json");
  const cvPath = path.join(DADOS, "cv-base.md");
  const promptPath = path.join(DADOS, "curriculo", "adaptacao-prompt.md");
  const outPath = path.join(DADOS, "curriculo", "adaptado-busca.md");

  if (!fs.existsSync(pedidoPath) || !fs.existsSync(cvPath)) {
    console.error("pedido-adaptacao.json ou cv-base.md ausente");
    process.exit(1);
  }

  const pedido = JSON.parse(fs.readFileSync(pedidoPath, "utf8"));
  const cvBase = fs.readFileSync(cvPath, "utf8");
  const prompt = fs.existsSync(promptPath)
    ? fs.readFileSync(promptPath, "utf8")
    : "Adapte o CV para os alvos do pedido.";

  let conteudo;

  if (process.env.CURSOR_API_KEY) {
    try {
      conteudo = await adaptarComCursor(prompt, cvBase);
    } catch (err) {
      console.warn("Cursor SDK falhou, usando fallback:", err.message);
      conteudo = fallbackAdaptacao(cvBase, pedido);
    }
  } else {
    conteudo = fallbackAdaptacao(cvBase, pedido);
  }

  fs.writeFileSync(outPath, conteudo, "utf8");
  console.log("adaptado-busca.md gerado");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
