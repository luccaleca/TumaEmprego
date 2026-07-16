/**
 * Pitch “A empresa deseja saber mais sobre você” — por vaga.
 *
 * NÃO é o campo de Experiência do Perfil/CV.
 * É um parágrafo que resume quem você é, a trajetória e por que é útil
 * no desafio da JD (sem mendigar empresa, sem inventar).
 */

import {
  experienciaParaSegmento,
  loadBanco,
  projetosParaSegmento,
} from "./conteudoBanco.js";
import { getFonteCandidato } from "./fonteCandidato.js";
import {
  getPerfil,
  inferirPerfilPorVaga,
  resolverPerfilSlug,
} from "./perfilCvSegmento.js";
import { jdEnfatizaProjetosIa, normalizeTexto, termosDaVaga } from "./termosVaga.js";

function plain(texto) {
  return String(texto ?? "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function empresaDaExp(exp) {
  const empresa = String(exp?.empresa ?? "").trim();
  if (empresa) return empresa;
  const titulo = String(exp?.titulo ?? "").trim();
  const m = titulo.match(/^(.+?)\s*[—–-]\s+/);
  return m ? m[1].trim() : "";
}

function scoreTrecho(texto, termos) {
  const n = normalizeTexto(texto);
  return termos.reduce((acc, t) => {
    const tt = normalizeTexto(t);
    return acc + (tt && n.includes(tt) ? 1 : 0);
  }, 0);
}

/** Uma frase curta de prova (não copia bullet de CV). */
function provaEmUmaFrase(exp, termos) {
  const bullets = [...(exp?.bullets ?? [])]
    .map((b) => plain(b).replace(/^[-•]\s*/, ""))
    .filter(Boolean)
    .sort((a, b) => scoreTrecho(b, termos) - scoreTrecho(a, termos));

  const top = bullets[0];
  if (!top) return "";

  // Enxuga: pegar ideia, não o bullet inteiro do ATS
  let frase = top;
  if (frase.length > 140) {
    const corte = frase.slice(0, 140);
    const ult = Math.max(corte.lastIndexOf(","), corte.lastIndexOf(" —"), corte.lastIndexOf("."));
    frase = (ult > 60 ? corte.slice(0, ult) : corte).trim();
  }
  return frase.charAt(0).toLowerCase() + frase.slice(1);
}

function nomesProjetosRelevantes(banco, slug, termos, titulo, descricao, max = 2) {
  const lista = projetosParaSegmento(banco, slug, [], {
    termos,
    enfatizaProjetosIa: slug === "ia-ml" || jdEnfatizaProjetosIa(titulo, descricao),
  });
  return lista.slice(0, max).map((p) => p.nome).filter(Boolean);
}

function identidadePorAngulo(perfil, jdNorm) {
  if (
    /agente|prompt|llm|rag|inteligencia artificial|inteligência artificial|ai first/.test(
      jdNorm,
    ) ||
    perfil.slug === "ia-ml"
  ) {
    return "gosto de unir código e IA para resolver problema real, não só experimentar ferramenta";
  }
  if (/api|back-?end|backend|integr|python|fastapi/.test(jdNorm) || perfil.slug === "desenvolvimento") {
    return "gosto de construir ferramenta que o time usa de verdade — API, sistema interno, automação";
  }
  if (/dado|sql|postgres|dashboard|analis|bi |invest/.test(jdNorm) || perfil.slug === "dados-bi-analytics") {
    return "gosto de tirar dado do escuro e virar acompanhamento que a equipe consulta no dia a dia";
  }
  if (/marketing|growth|ads|midia|mídia|performance/.test(jdNorm) || perfil.slug === "marketing-growth") {
    return "gosto de juntar marketing e dado para entender o que performa e ajustar rápido";
  }
  return `me interesso por ${perfil.label.toLowerCase()} com entrega prática`;
}

function utilidadeParaVaga(jdNorm, perfil, flags) {
  const { temSql, temPython, temWeb, temIa } = flags;
  const outs = [];

  if (/api|integr|fastapi|back-?end|backend|ferramenta interna|software/.test(jdNorm) && (temPython || temWeb)) {
    outs.push("apoiar na construção e manutenção de APIs, integrações e ferramentas internas");
  }
  if (/automac|automação|processo manual|n8n|make/.test(jdNorm)) {
    outs.push("automatizar processos manuais para aliviar o fluxo do time");
  }
  if (/sql|postgres|banco|dado|dashboard|analis|kpi|invest/.test(jdNorm) && temSql) {
    outs.push("apoiar decisões com SQL, dados e visualização clara");
  }
  if (
    (/agente|prompt|llm|rag|inteligencia artificial|inteligência artificial|ai first/.test(jdNorm) ||
      perfil.slug === "ia-ml") &&
    temIa
  ) {
    outs.push("prototipar e explicar soluções com IA (consulta assistida, geração, automação)");
  }
  if (!outs.length) {
    if (perfil.slug === "desenvolvimento" || temWeb) {
      outs.push("entregar software interno com foco em quem vai usar");
    } else if (perfil.slug === "dados-bi-analytics" || temSql) {
      outs.push("organizar dados e tornar progresso e resultado visíveis");
    } else {
      outs.push("aprender rápido e entregar o que move a operação");
    }
  }

  if (outs.length === 1) return outs[0];
  return `${outs[0]} e ${outs[1]}`;
}

/**
 * @param {{
 *   vaga_titulo?: string,
 *   vaga_descricao?: string,
 *   segmento_slug?: string,
 *   fonte?: object,
 * }} input
 */
export function buildDescricaoParaVaga(input = {}) {
  const fonte = input.fonte ?? getFonteCandidato();
  const banco = fonte.banco ?? loadBanco();
  const titulo = String(input.vaga_titulo ?? "").trim();
  const descricao = String(input.vaga_descricao ?? "").trim();
  const termos = termosDaVaga(titulo, descricao);
  const jdNorm = normalizeTexto(`${titulo}\n${descricao}`);

  const slug = resolverPerfilSlug(
    input.segmento_slug || inferirPerfilPorVaga(titulo, descricao, fonte),
  );
  const perfil = getPerfil(slug);

  const formacao = fonte.formacao ?? {};
  const curso = String(formacao.curso ?? "").trim();
  const instituicao = String(formacao.instituicao ?? "").trim();

  const quem =
    curso && instituicao
      ? `Sou estudante de ${curso} no ${instituicao}`
      : curso
        ? `Sou estudante de ${curso}`
        : "Sou estudante de tecnologia";

  const identidade = identidadePorAngulo(perfil, jdNorm);

  const exp = experienciaParaSegmento(banco, slug);
  const empresa = empresaDaExp(exp);
  const prova = provaEmUmaFrase(exp, termos);
  const projetos = nomesProjetosRelevantes(banco, slug, termos, titulo, descricao, 2);

  const blob = normalizeTexto(
    `${prova}\n${projetos.join(" ")}\n${perfil.stack ?? ""}\n${perfil.resumoExp ?? ""}`,
  );
  const flags = {
    temSql: /sql|postgres|power bi/.test(blob),
    temPython: /python|fastapi|pandas/.test(blob),
    temWeb: /react|next|node|javascript|php|api/.test(blob),
    temIa: /llm|rag|\bia\b|gemini|chroma|n8n|openai|ollama|chat sql/.test(blob),
  };

  let trajetoria = "";
  if (empresa && prova) {
    trajetoria = `No estágio na ${empresa}, ${prova}`;
  } else if (prova) {
    trajetoria = `Na prática, ${prova}`;
  } else if (empresa) {
    trajetoria = `Já estagiei na ${empresa}, com foco em entrega usada pelo time`;
  }

  let projetosTxt = "";
  if (projetos.length === 1) {
    projetosTxt = `Fora disso, desenvolvo o projeto ${projetos[0]}`;
  } else if (projetos.length > 1) {
    projetosTxt = `Fora disso, desenvolvo projetos como ${projetos[0]} e ${projetos[1]}`;
  }

  const util = utilidadeParaVaga(jdNorm, perfil, flags);
  const fecha = `Nesta vaga, posso ${util} — com vontade de aprender o negócio e entregar de forma concreta.`;

  return [quem + ": " + identidade + ".", trajetoria + (trajetoria.endsWith(".") ? "" : trajetoria ? "." : ""), projetosTxt + (projetosTxt && !projetosTxt.endsWith(".") ? "." : ""), fecha]
    .map((s) => plain(s))
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .replace(/\.\s*\./g, ".")
    .trim();
}
