import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getBusca, getCvBase } from "@/lib/dados";
import { getVagaCatalogo } from "@/lib/vagaCatalogo";
import { montarPedidosAdaptacao } from "@/lib/adaptarCvBusca";
import { adaptarCvParaBusca } from "@/lib/adaptarCvLocal";

const DADOS_ROOT = path.join(process.cwd(), "..", "dados");
const OUT_DIR = path.join(DADOS_ROOT, "curriculo", "teste-variacoes");

function pick(md, re, fallback = null) {
  const m = md.match(re);
  return m ? m[1].trim() : fallback;
}

function listarProjetos(md) {
  const bloco = pick(md, /## Projetos\n\n([\s\S]*?)(?=\n## )/, "") ?? "";
  return [...bloco.matchAll(/^### ([^\n]+)/gm)].map((m) => m[1].trim());
}

function listarBulletsExp(md) {
  const bloco = pick(md, /## Experiência\n\n([\s\S]*?)(?=\n## )/, "") ?? "";
  return bloco
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .slice(0, 4)
    .map((l) => l.replace(/^- /, ""));
}

export async function GET() {
  try {
    const busca = getBusca();
    const cvBase = getCvBase()?.trim();
    if (!cvBase) {
      return NextResponse.json(
        { error: "Falta o currículo base" },
        { status: 400 },
      );
    }

    const catalogo = await getVagaCatalogo();
    const pedidos = montarPedidosAdaptacao(busca, catalogo);

    if (!pedidos.length) {
      return NextResponse.json(
        { error: "Ative ao menos um segmento na busca" },
        { status: 400 },
      );
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });

    const variacoes = pedidos.map((pedido) => {
      const markdown = adaptarCvParaBusca(cvBase, pedido);
      const slug = pedido.segmento.slug;
      fs.writeFileSync(path.join(OUT_DIR, `${slug}.md`), markdown, "utf8");

      return {
        slug,
        nome: pedido.segmento.nome,
        cargoAlvo: pick(markdown, /\*\*Cargo-alvo:\*\* ([^\n]+)/),
        experienciaTitulo: pick(markdown, /## Experiência\n\n### ([^\n]+)/),
        experienciaNota: pick(markdown, /\n\n\*([^*]+)\*\s*(?=\n## |\n*$)/),
        projetos: listarProjetos(markdown),
        bulletsExperiencia: listarBulletsExp(markdown),
        arquivo: `dados/curriculo/teste-variacoes/${slug}.md`,
      };
    });

    return NextResponse.json({
      ok: true,
      fontes: {
        cvBase: "dados/cv-base.md",
        conteudo: "dados/conteudo/banco.yml",
        segmentosAtivos: busca.segmentos_ativos ?? [],
      },
      variacoes,
      dica: "Salve em Segmentos para gravar em dados/curriculo/segmentacoes/ e ver em Currículo.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Falha no teste de variações", detail: err.message },
      { status: 500 },
    );
  }
}
