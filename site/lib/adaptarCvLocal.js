/**
 * Monta CV local por segmento ou vaga.
 */

import { slugsSegmentosAtivos } from "./segmentosAtivos.js";
import {
  buildResumoPerfil,
  getPerfil,
  inferirPerfilPorVaga,
  resolverPerfilSlug,
  termosCandidatoParaPerfil,
} from "./perfilCvSegmento.js";
import {
  certificacoesParaSegmento,
  competenciasDoBanco,
  experienciaParaSegmento,
  formatarBlocoProjeto,
  loadBanco,
  projetosParaSegmento,
} from "./conteudoBanco.js";
import { bulletsAtividadesParaSegmento } from "./atividadesConteudo.js";
import {
  formatarContatoCv,
  formatarFormacaoCv,
  getFonteCandidato,
} from "./fonteCandidato.js";
import {
  bulletPareceMetadado,
  cargoAlvoNeutroDaVaga,
  jdEnfatizaProjetosIa,
  termosDaVaga,
} from "./termosVaga.js";

function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function scoreTexto(texto, termos, peso = 1) {
  const lower = normalize(texto);
  let score = 0;
  for (const termo of termos) {
    if (lower.includes(normalize(termo))) score += peso;
  }
  return score;
}

function parseSections(raw) {
  const parts = raw.split(/^## /m);
  const preamble = parts[0]?.trim() ?? "";
  const sections = [];

  for (const part of parts.slice(1)) {
    const nl = part.indexOf("\n");
    sections.push({
      title: part.slice(0, nl).trim(),
      body: part.slice(nl + 1).trim(),
    });
  }

  return { preamble, sections };
}

function splitSubsections(body) {
  const chunks = body.split(/^### /m);
  if (chunks.length <= 1) return [{ title: null, body }];

  const intro = chunks[0]?.trim();
  const subs = chunks.slice(1).map((chunk) => {
    const nl = chunk.indexOf("\n");
    return { title: chunk.slice(0, nl).trim(), body: chunk.slice(nl + 1).trim() };
  });

  return intro ? [{ title: null, body: intro }, ...subs] : subs;
}

function extractBullets(text) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "));
}

function reorderBullets(bullets, termos, max = 5) {
  return [...bullets]
    .sort((a, b) => scoreTexto(b, termos, 2) - scoreTexto(a, termos, 2))
    .slice(0, max);
}

/** Chave semântica — 1 tema forte por CV (evita 2× Power BI, 2× portal…). */
function chaveSemanticaBullet(bullet) {
  const n = normalize(String(bullet ?? "").replace(/\*\*/g, ""));
  const unicos = [
    "power bi",
    "portal do vendedor",
    "painel admin",
    "estoque",
    "sendflow",
    "whatsapp",
    "meta ads",
    "google ads",
    "python",
    "pandas",
    "excel",
    "firebase",
    "receita",
    "csv",
    "sql",
  ];
  for (const sig of unicos) {
    if (n.includes(sig)) return sig;
  }
  return n.slice(0, 52);
}

function dedupeBulletsNear(bullets) {
  const vistos = new Set();
  const out = [];
  for (const b of bullets) {
    const k = chaveSemanticaBullet(b);
    if (!k || vistos.has(k)) continue;
    vistos.add(k);
    out.push(b);
  }
  return out;
}

/** Preferência: prova (ação + ferramenta + pra quê) + impacto; pool não perde por falta de **. */
function scoreBulletExperiencia(bullet, termos, perfilTermos = [], perfilSlug = "", origem = "") {
  const t = String(bullet ?? "");
  const plain = t.replace(/\*\*/g, "");
  let s = scoreTexto(plain, termos, 2);
  s += scoreTexto(plain, perfilTermos, 3);

  // Pool de estágio (atividades.yml) é a fonte preferida de prova
  if (origem === "pool") s += 10;

  // Ferramenta citada (com ou sem negrito)
  if (
    /\b(sql|python|pandas|power bi|excel|react|next\.?js|node|php|firebase|n8n|sendflow|meta ads|google ads|postgresql)\b/i.test(
      plain,
    )
  ) {
    s += 4;
  } else if (/\*\*[^*]+\*\*/.test(t)) {
    s += 2;
  }

  // Pra quê / consequência (problema → ferramenta → resultado)
  if (
    /para |pra |com o objetivo|facilit|permitiu|apoi|resolv|entreg|vis[ií]vel|prioriz|campanha|lan[cç]amento|m[ií]dia|dashboard|funil|sem |reduz|centraliz|confi[aá]ve/i.test(
      plain,
    )
  ) {
    s += 5;
  }

  // Genérico demais: várias tools sem entrega concreta (mata prova específica)
  const toolsHit = (
    plain.match(
      /\b(sql|python|pandas|power bi|excel|react|next\.?js|node|php|firebase|postgresql)\b/gi,
    ) ?? []
  ).length;
  if (
    toolsHit >= 3 &&
    !/\d|dashboard|4 times|lista|csv|cruz|estoque|portal do vendedor|receita|procv/i.test(plain)
  ) {
    s -= 12;
  }

  // Impacto confirmado (estilo CV feito à mão) sobe
  if (/\d+\s*%|R\$\s*\d|receita|crescimento de/i.test(plain)) s += 9;
  // Entrega concreta sobe
  if (/4 times|dashboard|lista limpa|csv|cruz|sem planilha|procv|sendflow/i.test(plain)) s += 4;
  if (/portal do vendedor|estoque de pe[cç]as/i.test(plain) && scoreTexto(plain, perfilTermos, 1) === 0) {
    s -= 4;
  }
  // Só em IA: BI/ops da Ótica não compete com projetos produto
  if (
    perfilSlug === "ia-ml" &&
    /power bi|estoque de pe[cç]as|4 times de vendas|portal do vendedor/i.test(plain)
  ) {
    s -= 5;
  }
  if (plain.replace(/^-\s*/, "").length < 40) s -= 6;
  if (plain.replace(/^-\s*/, "").length > 200) s -= 2;
  return s;
}

function escolherBulletsExperiencia(
  candidatos,
  termos,
  max = 4,
  perfilTermos = [],
  perfilSlug = "",
) {
  // candidatos: string[] ou { texto, origem }[]
  const items = candidatos.map((c) =>
    typeof c === "string" ? { texto: c, origem: "" } : c,
  );

  return dedupeBulletsNear(
    [...items]
      .filter((b) => b.texto && !bulletPareceMetadado(b.texto))
      .sort(
        (a, b) =>
          scoreBulletExperiencia(b.texto, termos, perfilTermos, perfilSlug, b.origem) -
          scoreBulletExperiencia(a.texto, termos, perfilTermos, perfilSlug, a.origem),
      )
      .map((b) => b.texto),
  )
    .slice(0, max)
    .map((b) => (String(b).startsWith("- ") ? b : `- ${b}`));
}

function montarProjetos(perfil, banco, ctx = null) {
  const enfatizaProjetosIa =
    perfil.slug === "ia-ml" ||
    (ctx?.tipo === "vaga" &&
      jdEnfatizaProjetosIa(ctx.titulo, ctx.descricao));
  const maxProj = enfatizaProjetosIa || perfil.slug === "ia-ml" ? 2 : 1;
  const projetos = projetosParaSegmento(banco, perfil.slug, perfil.projetosOrdem, {
    termos: ctx?.termosVaga ?? [],
    enfatizaProjetosIa,
  }).slice(0, maxProj);
  return projetos
    .map((p) => {
      if (Array.isArray(p.stackUso) && p.stackUso.length > 4) {
        return formatarBlocoProjeto({ ...p, stackUso: p.stackUso.slice(0, 4) });
      }
      return formatarBlocoProjeto(p);
    })
    .join("\n\n");
}

function termosEfetivos(perfil, ctx, fonte) {
  const base = [...perfil.termos, ...termosCandidatoParaPerfil(perfil.slug, fonte)];
  if (ctx.tipo !== "vaga") return [...new Set(base)];

  const daVaga = ctx.termosVaga?.length
    ? ctx.termosVaga
    : termosDaVaga(ctx.titulo, ctx.descricao);
  return [...new Set([...base, ...daVaga])];
}

function montarExperiencia(perfil, banco, parsed, ctx, fonte) {
  const termos = termosEfetivos(perfil, ctx, fonte);
  const perfilTermos = perfil.termos ?? [];
  const exp = experienciaParaSegmento(banco, perfil.slug);
  if (exp) {
    const periodo = exp.periodo
      ? `**Período:** ${exp.periodo}${exp.local ? ` · ${exp.local}` : ""}`
      : "";
    let baseBullets = [...(exp.bullets ?? [])];
    if (perfil.slug === "ia-ml") {
      const dadosExp = experienciaParaSegmento(banco, "dados-bi-analytics");
      const vistos = new Set(baseBullets.map((t) => String(t).slice(0, 48).toLowerCase()));
      for (const t of dadosExp?.bullets ?? []) {
        const k = String(t).slice(0, 48).toLowerCase();
        if (vistos.has(k)) continue;
        baseBullets.push(t);
        vistos.add(k);
      }
    }
    // Pool (atividades.yml) = provas de estágio; banco = complemento / impacto
    const doPool = bulletsAtividadesParaSegmento(perfil.slug, {
      termos: [...termos, ...perfilTermos],
      max: 12,
      existentes: [],
    });
    const misturados = [
      ...doPool.map((texto) => ({ texto, origem: "pool" })),
      ...baseBullets.map((texto) => ({ texto, origem: "banco" })),
    ];
    // Vaga IA/agentes: Experiência enxuta — prova principal está nos projetos
    const maxExp =
      perfil.slug === "ia-ml" &&
      ctx?.tipo === "vaga" &&
      jdEnfatizaProjetosIa(ctx.titulo, ctx.descricao)
        ? 2
        : perfil.slug === "ia-ml"
          ? 3
          : 4;
    const bullets = escolherBulletsExperiencia(
      misturados,
      termos,
      maxExp,
      perfilTermos,
      perfil.slug,
    );
    if (!bullets.length) return "";
    return `### ${exp.titulo}\n\n${periodo}\n\n${bullets.join("\n")}`;
  }

  const sec = parsed.sections.find((s) => /experi/i.test(s.title));
  if (!sec) return "";

  const sub = splitSubsections(sec.body).find((s) => s.title);
  if (!sub) return sec.body;

  const bullets = escolherBulletsExperiencia(
    extractBullets(sub.body),
    termos,
    4,
    perfilTermos,
    perfil.slug,
  );
  const periodo =
    sub.body.match(/\*\*Período:\*\*[^\n]+/)?.[0] ??
    "**Período:** Fev/2025 – Set/2025 · São Paulo – SP";

  return `### ${perfil.expTitulo}\n\n${periodo}\n\n${bullets.join("\n")}`;
}

function adaptarCabecalho(parsed, perfil, fonte, ctx = null) {
  const nome = fonte.profile?.nome?.trim()
    ? `# ${fonte.profile.nome.trim()}`
    : parsed.preamble.split("\n").find((l) => l.startsWith("# ")) ?? "# Candidato";

  const contato = formatarContatoCv(fonte.profile, parsed.preamble);
  const cargo =
    ctx?.tipo === "vaga"
      ? cargoAlvoNeutroDaVaga(perfil, ctx.titulo, ctx.descricao)
      : perfil.cargoAlvo;

  return `${nome}

**Cargo-alvo:** ${cargo}  
${contato}`;
}

function resolverPerfilSlugAdaptacao(ctx, fonte) {
  if (ctx.tipo === "busca") {
    return resolverPerfilSlug(ctx.slug);
  }

  if (ctx.segmento_slug) {
    return resolverPerfilSlug(ctx.segmento_slug);
  }

  const inferido = resolverPerfilSlug(
    inferirPerfilPorVaga(ctx.titulo ?? "", ctx.descricao ?? "", fonte),
  );
  const ativos = slugsSegmentosAtivos().map(resolverPerfilSlug);
  if (!ativos.length) return inferido;
  if (ativos.includes(inferido)) return inferido;
  return resolverPerfilSlug(ativos[0]);
}

function adaptarInterno(cvBase, ctx) {
  const fonte = ctx.fonte ?? getFonteCandidato();
  const perfilSlug =
    ctx.tipo === "busca"
      ? resolverPerfilSlug(ctx.slug)
      : resolverPerfilSlugAdaptacao(ctx, fonte);

  const perfil = getPerfil(perfilSlug);
  const banco = fonte.banco ?? loadBanco();
  const parsed = parseSections(cvBase);
  const termosVaga =
    ctx.tipo === "vaga" ? termosDaVaga(ctx.titulo, ctx.descricao) : [];
  const ctxRico = { ...ctx, termosVaga, fonte };

  const experienciaBody = montarExperiencia(perfil, banco, parsed, ctxRico, fonte);
  const projetosBody = montarProjetos(perfil, banco, ctxRico);
  const certs = certificacoesParaSegmento(banco, perfil.slug, {
    termosVaga,
    max: 5,
  });
  const evidencia = [
    experienciaBody,
    projetosBody,
    certs.join("\n"),
    perfil.stack,
    perfil.resumoExp,
  ]
    .filter(Boolean)
    .join("\n");

  // Densidade estilo feito à mão: Experiência antes de Competências.
  // IA: Projetos antes (prova principal).
  const projetosAntesExp =
    perfil.slug === "ia-ml" ||
    (ctx.tipo === "vaga" && jdEnfatizaProjetosIa(ctx.titulo, ctx.descricao));

  const blocoExpProj = projetosAntesExp
    ? [
        { title: "Projetos", body: projetosBody },
        { title: "Experiência", body: experienciaBody },
      ]
    : [
        { title: "Experiência", body: experienciaBody },
        { title: "Projetos", body: projetosBody },
      ];

  const sections = [
    { title: "Resumo", body: buildResumoPerfil(perfil, ctxRico) },
    ...blocoExpProj.filter((s) => String(s.body ?? "").trim()),
    {
      title: "Competências",
      body: competenciasDoBanco(banco, perfil.slug, fonte, {
        termosVaga,
        evidencia,
        termosSegmento: perfil.termos ?? [],
      }),
    },
  ];

  const formacaoMd = formatarFormacaoCv(fonte.formacao);
  if (formacaoMd) {
    sections.push({ title: "Formação", body: formacaoMd });
  } else {
    const formacao = parsed.sections.find((s) => /formação|formacao/i.test(s.title));
    if (formacao) sections.push({ title: "Formação", body: formacao.body });
  }

  sections.push({
    title: "Certificações",
    body: certs.length ? certs.join("\n") : "- —",
  });

  return rebuildCv({
    preamble: adaptarCabecalho(parsed, perfil, fonte, ctxRico),
    sections,
  });
}

function rebuildCv({ preamble, sections }) {
  const body = sections.map((s) => `## ${s.title}\n\n${s.body}`).join("\n\n");
  return `${preamble}\n\n${body}`.trim() + "\n";
}

export function adaptarCvParaBusca(cvBase, pedido) {
  const fonte = pedido.fonte ?? getFonteCandidato();
  return adaptarInterno(cvBase, {
    tipo: "busca",
    slug: pedido.segmento?.slug ?? "dados-bi-analytics",
    nome: pedido.segmento?.nome,
    primarios: pedido.alvos_primarios ?? pedido.alvos ?? [],
    complementares: pedido.alvos_complementares ?? [],
    fonte,
  });
}

export function adaptarCvParaVaga(cvBase, pedido) {
  const fonte = pedido.fonte ?? getFonteCandidato();
  const segmento_slug =
    pedido.segmento_slug ??
    inferirPerfilPorVaga(pedido.vaga_titulo, pedido.vaga_descricao, fonte);

  return adaptarInterno(cvBase, {
    tipo: "vaga",
    titulo: pedido.vaga_titulo,
    descricao: pedido.vaga_descricao,
    segmento_slug,
    fonte,
  });
}

export const MOTOR_CV_VERSAO = 20;
