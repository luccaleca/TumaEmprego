/**
 * Teste: fonte da verdade (banco.yml + cv-base.md) → variações por segmento.
 * Uso: node scripts/teste-fonte-variacoes.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getBusca, getCvBase } from "../lib/dados.js";
import { getVagaCatalogo } from "../lib/vagaCatalogo.js";
import { montarPedidosAdaptacao, executarAdaptacaoCv } from "../lib/adaptarCvBusca.js";
import { adaptarCvParaBusca } from "../lib/adaptarCvLocal.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DADOS = path.join(__dirname, "..", "..", "dados");
const OUT_DIR = path.join(DADOS, "curriculo", "teste-variacoes");

function pick(md, re, fallback = "—") {
  const m = md.match(re);
  return m ? m[1].trim().replace(/\*\*/g, "") : fallback;
}

function listarProjetos(md) {
  const bloco = pick(md, /## Projetos\n\n([\s\S]*?)(?=\n## )/, "");
  return [...bloco.matchAll(/^### ([^\n]+)/gm)].map((m) => m[1].trim());
}

function listarBulletsExp(md) {
  const bloco = pick(md, /## Experiência\n\n([\s\S]*?)(?=\n## )/, "");
  return bloco
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .slice(0, 4)
    .map((l) => l.replace(/^- /, ""));
}

function resumoSegmento(label, md) {
  return {
    label,
    cargoAlvo: pick(md, /\*\*Cargo-alvo:\*\* ([^\n]+)/),
    expTitulo: pick(md, /## Experiência\n\n### ([^\n]+)/),
    expNota: pick(md, /\n\n\*([^*]+)\*\s*$/m, "").slice(0, 120),
    projetos: listarProjetos(md),
    bullets: listarBulletsExp(md),
    competenciasTop: pick(md, /## Competências\n\n([\s\S]*?)(?=\n## )/, "")
      .split("\n")
      .filter(Boolean)
      .slice(0, 4)
      .map((l) => l.replace(/^- /, "")),
  };
}

function linhaCmp(a, b) {
  const iguais = a === b;
  return iguais ? `✓ ${a}` : `• **${a}**  \n  _(≠ ${b})_`;
}

async function main() {
  const busca = getBusca();
  const cvBase = getCvBase();
  const catalogo = await getVagaCatalogo();
  const pedidos = montarPedidosAdaptacao(busca, catalogo);

  if (!pedidos.length) {
    console.error("Nenhum segmento ativo em dados/config/busca.yml");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const variacoes = pedidos.map((pedido) => {
    const md = adaptarCvParaBusca(cvBase, pedido);
    const slug = pedido.segmento.slug;
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.md`), md, "utf8");
    return { slug, pedido, md, resumo: resumoSegmento(pedido.segmento.nome, md) };
  });

  const [a, b, c] = variacoes;

  let comparacao = `# Teste — fonte da verdade → variações

Gerado em ${new Date().toISOString()}

## Fontes usadas

| Fonte | Arquivo |
|-------|---------|
| CV base | \`dados/cv-base.md\` |
| Conteúdo | \`dados/conteudo/banco.yml\` |
| Segmentos | \`${(busca.segmentos_ativos ?? []).join("`, `")}\` |

## ${variacoes.length} variação(ões) gerada(s)

`;

  for (const v of variacoes) {
    comparacao += `### ${v.resumo.label} (\`${v.slug}\`)

- **Cargo-alvo:** ${v.resumo.cargoAlvo}
- **Experiência (título):** ${v.resumo.expTitulo}
- **Projetos (ordem):** ${v.resumo.projetos.join(" → ") || "—"}
- **Bullets exp (amostra):**
${v.resumo.bullets.map((b) => `  - ${b}`).join("\n")}

`;
  }

  if (a && b) {
    comparacao += `## O que muda entre ${a.resumo.label} e ${b.resumo.label}

| Campo | ${a.resumo.label} | ${b.resumo.label} |
|-------|------------|------------|
| Experiência | ${a.resumo.expTitulo} | ${b.resumo.expTitulo} |
| Projeto 1 | ${a.resumo.projetos[0] ?? "—"} | ${b.resumo.projetos[0] ?? "—"} |
| Projeto 2 | ${a.resumo.projetos[1] ?? "—"} | ${b.resumo.projetos[1] ?? "—"} |

**Mesma fonte, ênfases diferentes** — título da experiência, ordem dos projetos e bullets vêm do \`banco.yml\`, não são copiados iguais do cv-base.

`;
  }

  if (c) {
    comparacao += `### Também: ${c.resumo.label}

- Experiência: ${c.resumo.expTitulo}
- Projetos: ${c.resumo.projetos.join(" → ")}

`;
  }

  comparacao += `## Arquivos gerados

${variacoes.map((v) => `- \`dados/curriculo/teste-variacoes/${v.slug}.md\``).join("\n")}

## Regenerar no app

1. Abra **Segmentos** → **Salvar** (grava em \`dados/curriculo/segmentacoes/\`)
2. Veja em **Currículo** → Por segmento

`;

  fs.writeFileSync(path.join(OUT_DIR, "README.md"), comparacao, "utf8");

  console.log(comparacao);

  const adaptacao = await executarAdaptacaoCv(busca, catalogo);
  console.log("\n--- Adaptação no app ---");
  console.log(`Status: ${adaptacao.status}`);
  if (adaptacao.segmentacoes?.length) {
    for (const s of adaptacao.segmentacoes) {
      console.log(`  • ${s.segmento_slug ?? "?"} → ${s.id} (${s.vaga_titulo?.slice(0, 50)}…)`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
