/**
 * Responde perguntas de formulário com base só em dados/ (sem inventar).
 * Tom: texto pronto pra colar — claro, em 1ª pessoa, sem jargão interno.
 */

import { buildDescricaoParaVaga } from "./descricaoVaga.js";
import { experienciaParaSegmento, loadBanco } from "./conteudoBanco.js";
import { getFormacao, getProfile, getRespostasComportamental, getRespostasPadrao } from "./dados.js";
import { getFonteCandidato } from "./fonteCandidato.js";
import { inferirPerfilPorVaga } from "./perfilCvSegmento.js";

function norm(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function limparBloco(texto) {
  return String(texto ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
}

function frase(texto) {
  const t = limparBloco(texto);
  if (!t) return "";
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

function scoreTags(perguntaNorm, tags) {
  let score = 0;
  for (const tag of tags ?? []) {
    const t = norm(tag);
    if (!t) continue;
    if (perguntaNorm.includes(t)) score += 3;
    for (const palavra of t.split(" ")) {
      if (palavra.length > 3 && perguntaNorm.includes(palavra)) score += 1;
    }
  }
  return score;
}

/** História em parágrafo contínuo (melhor pra formulário do que rótulos STAR). */
function formatarHistoriaProsa(h) {
  const s = limparBloco(h.situacao);
  const t = limparBloco(h.tarefa);
  const a = limparBloco(h.acao);
  const r = limparBloco(h.resultado);
  const ref = limparBloco(h.reflexao);

  const frases = [];
  if (s) frases.push(frase(s));
  if (t) {
    // YAML costuma trazer infinitivo ("Analisar a base...") — vira frase natural
    const tarefa = /^[a-záàâãéêíóôõúç]/i.test(t)
      ? `Eu precisava ${t.charAt(0).toLowerCase()}${t.slice(1)}`
      : t;
    frases.push(frase(tarefa));
  }
  if (a) frases.push(frase(a));
  if (r) frases.push(frase(r));
  if (ref) frases.push(frase(ref));
  return frases.join(" ");
}

function perguntaEhFormacaoAcademica(pergunta) {
  const q = norm(pergunta);
  return (
    /(qual curso|curso que (voce |esta |faz|curs)|esta cursando|esta fazendo|faculdade|universidade|graduacao|bacharel|semestre|quando (se )?forma|previsao (de )?(formatura|termino|terminar)|ano de (formatura|conclusao)|instituto maua|\bimt\b)/.test(
      q,
    ) ||
    (/\bcurso\b/.test(q) &&
      /(fazendo|cursando|terminar|termino|formatura|previsao|semestre|faculdade|gradu)/.test(q))
  );
}

function perguntaEhComportamental(pergunta) {
  const q = norm(pergunta);
  return /(conte (uma|um)|fale (de |sobre )?(uma|um)? ?situacao|exemplo de|desafio|conflito|trabalho em equipe|como voce (lida|aprende|agiu|reagiu)|me conte|narre|experiencia em que|situacao em que)/.test(
    q,
  );
}

function melhorHistoria(pergunta, historias) {
  if (perguntaEhFormacaoAcademica(pergunta)) return null;

  const q = norm(pergunta);
  let melhor = null;
  let melhorScore = 0;

  for (const h of historias ?? []) {
    let score = scoreTags(q, h.tags);
    const exemplo = norm(h.pergunta_exemplo);
    if (exemplo) {
      const palavras = exemplo.split(" ").filter((p) => p.length > 4);
      let overlap = 0;
      for (const p of palavras) {
        if (q.includes(p)) {
          score += 2;
          overlap += 1;
        }
      }
      if (overlap >= 3) score += 4;
    }
    if ((h.tags ?? []).some((t) => norm(t) === "curso") && /\bcurso\b/.test(q)) {
      score = Math.max(0, score - 3);
    }
    if (score > melhorScore) {
      melhorScore = score;
      melhor = h;
    }
  }

  const minimo = perguntaEhComportamental(pergunta) ? 2 : 4;
  if (melhorScore < minimo) return null;
  return melhor;
}

function formatarMesAno(valor) {
  const s = String(valor ?? "").trim();
  const m = s.match(/^(\d{2})\/(\d{4})$/);
  if (!m) return s;
  const meses = [
    "",
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const mes = meses[Number(m[1])] || m[1];
  return `${mes} de ${m[2]}`;
}

function respostaPadraoCampo(pergunta, padrao) {
  const q = norm(pergunta);
  const mapa = [
    {
      re: /pretensao|salario|remuneracao|quanto quer ganhar|expectativa salarial/,
      chave: "pretensao_salarial",
      texto: (v) => {
        const n = Number(String(v).replace(/\D/g, ""));
        const valor = Number.isFinite(n) && n > 0 ? `R$ ${n.toLocaleString("pt-BR")}` : String(v);
        return `Minha pretensão salarial é ${valor}.`;
      },
    },
    {
      re: /disponib|quando pode comecar|quando pode iniciar|inicio imediato/,
      chave: "disponibilidade",
      texto: (v) =>
        /imediat/i.test(String(v))
          ? "Estou disponível para começar imediatamente."
          : `Minha disponibilidade para início é: ${v}.`,
    },
    {
      re: /ingles|english/,
      chave: "ingles",
      texto: (v) => `Meu nível de inglês é ${String(v).toLowerCase()}.`,
    },
    {
      re: /espanhol|spanish/,
      chave: "espanhol",
      texto: (v) => `Meu nível de espanhol é ${String(v).toLowerCase()}.`,
    },
    {
      re: /\bexcel\b/,
      chave: "excel",
      texto: (v) => `Meu nível de Excel é ${String(v).toLowerCase()}.`,
    },
    {
      re: /remoto|presencial|hibrido|modalidade de trabalho|aceita remoto/,
      chave: "remoto",
      texto: (v) => {
        const s = String(v).toLowerCase();
        if (/qualquer/.test(s)) return "Aceito trabalho remoto, presencial ou híbrido.";
        return `Sobre modalidade de trabalho: ${v}.`;
      },
    },
    {
      re: /trabalha atualmente|emprego atual|esta empregado|vinculo atual/,
      chave: "trabalha_atualmente",
      texto: (v) =>
        /^(nao|não)$/i.test(String(v).trim())
          ? "Não estou trabalhando no momento."
          : `Situação atual de trabalho: ${v}.`,
    },
    {
      re: /viagem|viajar|disponivel para viagem/,
      chave: "aceita_viagem",
      texto: (v) =>
        /^(sim)$/i.test(String(v).trim())
          ? "Sim, tenho disponibilidade para viagens."
          : `Disponibilidade para viagens: ${v}.`,
    },
    {
      re: /como conheceu|como soube|onde viu a vaga/,
      chave: "como_conheceu",
      texto: (v) => `Fiquei sabendo da vaga pelo ${v}.`,
    },
  ];

  for (const item of mapa) {
    if (!item.re.test(q)) continue;
    const valor = padrao?.[item.chave];
    if (valor == null || valor === "") {
      return {
        texto: `Ainda não tenho essa informação cadastrada em respostas/padrao.yml (${item.chave}).`,
        fonte: "padrao",
      };
    }
    return { texto: item.texto(valor), fonte: "padrao" };
  }
  return null;
}

function respostaFormacao(pergunta, formacao) {
  const q = norm(pergunta);
  if (
    !perguntaEhFormacaoAcademica(pergunta) &&
    !/(forma|semestre|gradua|universidade|faculdade|instituto|quando se forma)/.test(q)
  ) {
    return null;
  }
  if (!formacao?.curso && !formacao?.instituicao) {
    return {
      texto: "Ainda não tenho a formação cadastrada em dados/config/formacao.yml.",
      fonte: "formacao",
    };
  }

  const cursoNome = formacao.curso || "";
  const grau = formacao.grau || "";
  const curso = grau && cursoNome ? `${grau} em ${cursoNome}` : cursoNome || grau;
  const instituicao = formacao.instituicao || "";
  const previsao = formacao.previsao_formatura
    ? formatarMesAno(formacao.previsao_formatura)
    : "";
  const semestre =
    formacao.semestre != null && formacao.semestre !== ""
      ? `${formacao.semestre}º semestre`
      : "";
  const status = String(formacao.status || "").toLowerCase();
  const cursando = /cursando|andamento/.test(status);

  let texto = "";
  if (cursando || semestre) {
    texto = `Estou cursando ${curso}${instituicao ? ` no ${instituicao}` : ""}`;
    if (semestre) texto += `, atualmente no ${semestre}`;
    texto = frase(texto);
    if (previsao) {
      texto += ` A previsão de conclusão é ${previsao}.`;
    }
  } else {
    texto = frase(`Minha formação é ${curso}${instituicao ? ` pelo ${instituicao}` : ""}`);
    if (previsao) texto += ` Conclusão: ${previsao}.`;
  }

  return { texto: texto.replace(/\s{2,}/g, " ").trim(), fonte: "formacao" };
}

function respostaSobreMim(pergunta, ctx) {
  const q = norm(pergunta);
  const ehSobre =
    /(sobre voce|fale sobre|apresente|quem e voce|conte.?nos|me fale|perfil|trajetoria|objetivo profissional|porque (voce )?quer|motiva)/.test(
      q,
    );
  const perguntaLonga = q.length > 100;

  if (!ehSobre && !perguntaLonga) return null;
  if (perguntaEhFormacaoAcademica(pergunta)) return null;
  if (perguntaEhComportamental(pergunta) && !ehSobre) return null;

  try {
    const texto = buildDescricaoParaVaga({
      vaga_titulo: ctx.vaga_titulo || "Estágio",
      vaga_descricao: ctx.vaga_descricao || pergunta,
    });
    if (texto?.trim()) return { texto: texto.trim(), fonte: "descricao" };
  } catch {
    /* ignore */
  }
  return null;
}

function nivelTech(fonte, reNome) {
  const lista = fonte?.tecnologias?.comNivel ?? [];
  for (const t of lista) {
    const nome = typeof t === "string" ? t : t.nome;
    if (reNome.test(String(nome))) {
      const nivel = typeof t === "string" ? null : t.nivel;
      return { nome, nivel };
    }
  }
  return null;
}

function bulletComTermo(banco, slug, re) {
  const slugs = [slug, "dados-bi-analytics", "desenvolvimento", "marketing-growth"].filter(
    (s, i, arr) => s && arr.indexOf(s) === i,
  );
  for (const s of slugs) {
    const exp = experienciaParaSegmento(banco, s);
    if (!exp?.bullets?.length) continue;
    const hit = exp.bullets.find((b) => re.test(norm(b)));
    if (hit) {
      return {
        empresa: exp.empresa || exp.titulo,
        bullet: limparBloco(hit).replace(/\*\*/g, "").replace(/^[-*]\s*/, ""),
      };
    }
  }
  const exp = experienciaParaSegmento(banco, slug);
  return { empresa: exp?.empresa || exp?.titulo || null, bullet: null };
}

function montarProsaPedacos(pedacos) {
  const limpos = pedacos.map(limparBloco).filter(Boolean);
  if (!limpos.length) return "";
  if (limpos.length === 1) return frase(limpos[0]);

  let out = frase(limpos[0]);
  for (let i = 1; i < limpos.length; i++) {
    let p = limpos[i]
      .replace(/^(por exemplo:|exemplo:|na prática[,:]?)\s*/i, "")
      .replace(/^,\s*/, "")
      .trim();
    if (!p) continue;
    if (/^(incluindo|aplicado)/i.test(p)) {
      out = `${out.replace(/\.$/, "")}, ${p.replace(/\.$/, "")}.`;
    } else {
      out = `${out} ${frase(p.charAt(0).toUpperCase() + p.slice(1))}`;
    }
  }
  return out.replace(/\s{2,}/g, " ").replace(/\.\s*\./g, ".").trim();
}

function respostaTech(pergunta, fonte) {
  const q = norm(pergunta);
  if (
    !/(python|pandas|sql|postgresql|postgres|power bi|excel|javascript|react|familiaridade|conhecimento em|experiencia (com|em))/.test(
      q,
    )
  ) {
    return null;
  }

  const banco = fonte.banco ?? loadBanco();
  const slug = inferirPerfilPorVaga("", pergunta, fonte) || "dados-bi-analytics";
  const pedacos = [];

  if (/python|pandas/.test(q)) {
    const tech = nivelTech(fonte, /python|pandas/i);
    const { empresa, bullet } = bulletComTermo(banco, slug, /python|pandas|csv/);
    pedacos.push(
      tech
        ? `Sim. Trabalho com ${tech.nome}${tech.nivel ? ` (nível ${String(tech.nivel).toLowerCase()})` : ""}`
        : "Sim, tenho prática com Python",
    );
    if (bullet) {
      const emp = empresa ? limparBloco(String(empresa).split(/[—–-]/)[0]) : "";
      const prova = limparBloco(bullet).replace(/^[-*]\s*/, "").replace(/\*\*/g, "");
      const provaLc = prova.charAt(0).toLowerCase() + prova.slice(1);
      pedacos.push(emp ? `No estágio na ${emp}, ${provaLc}` : prova);
    }
  } else if (/sql|postgres/.test(q)) {
    const tech = nivelTech(fonte, /sql|postgres/i);
    const { empresa, bullet } = bulletComTermo(banco, slug, /sql|consulta|join|postgres/);
    pedacos.push(
      tech
        ? `Sim. Uso ${tech.nome}${tech.nivel ? ` (nível ${String(tech.nivel).toLowerCase()})` : ""} no dia a dia`
        : "Sim, tenho experiência com SQL",
    );
    if (/join|group by|modelagem|relacional|postgres|select/.test(q)) {
      pedacos.push(
        "incluindo SELECT, JOINs, agregações (GROUP BY) e noção de modelagem relacional",
      );
    }
    if (bullet) {
      const emp = empresa ? limparBloco(String(empresa).split(/[—–-]/)[0]) : "";
      const prova = limparBloco(bullet).replace(/^[-*]\s*/, "").replace(/\*\*/g, "");
      const provaLc = prova.charAt(0).toLowerCase() + prova.slice(1);
      pedacos.push(emp ? `Exemplo na ${emp}: ${provaLc}` : `Exemplo: ${prova}`);
    }
  } else if (/power bi/.test(q)) {
    const tech = nivelTech(fonte, /power bi/i);
    const { empresa, bullet } = bulletComTermo(banco, slug, /power bi|dashboard|kpi/);
    pedacos.push(
      tech
        ? `Sim. Tenho experiência com Power BI${tech.nivel ? ` (${String(tech.nivel).toLowerCase()})` : ""}`
        : "Sim, tenho experiência com Power BI",
    );
    if (bullet) {
      pedacos.push(`Por exemplo: ${limparBloco(bullet).replace(/^[-*]\s*/, "")}`);
    } else if (empresa) {
      pedacos.push(
        `aplicado no estágio na ${limparBloco(String(empresa).split(/[—–-]/)[0])}`,
      );
    }
  } else if (/\bexcel\b/.test(q)) {
    const tech = nivelTech(fonte, /excel/i);
    const nivel = tech?.nivel || getRespostasPadrao()?.excel;
    return {
      texto: nivel
        ? `Sim. Meu nível de Excel é ${String(nivel).toLowerCase()}.`
        : "Sim, uso Excel no dia a dia de análise.",
      fonte: "tecnologias",
    };
  } else {
    const techs = (fonte?.tecnologias?.comNivel ?? [])
      .slice(0, 8)
      .map((t) =>
        typeof t === "string" ? t : `${t.nome}${t.nivel ? ` (${t.nivel})` : ""}`,
      );
    if (!techs.length) return null;
    return {
      texto: `No meu perfil técnico: ${techs.join(", ")}.`,
      fonte: "tecnologias",
    };
  }

  return { texto: montarProsaPedacos(pedacos), fonte: "tecnologias" };
}

/**
 * @param {{ pergunta: string, vaga_titulo?: string, vaga_descricao?: string }} input
 */
export function responderPerguntaCandidato(input) {
  const pergunta = String(input?.pergunta ?? "").trim();
  if (pergunta.length < 3) {
    return { status: "erro", motivo: "pergunta_curta", texto: "Cole a pergunta do formulário." };
  }

  const fonte = getFonteCandidato();
  const padrao = getRespostasPadrao() ?? {};
  const comportamental = getRespostasComportamental() ?? {};
  const formacao = getFormacao() ?? fonte.formacao ?? {};
  const profile = getProfile() ?? fonte.profile ?? {};

  const ctx = {
    vaga_titulo: input?.vaga_titulo,
    vaga_descricao: input?.vaga_descricao,
  };

  // 1) Fatos objetivos
  const objetiva =
    respostaFormacao(pergunta, formacao) ||
    respostaPadraoCampo(pergunta, padrao) ||
    respostaTech(pergunta, fonte);

  if (objetiva) {
    return {
      status: "ok",
      texto: objetiva.texto,
      fonte: objetiva.fonte,
      nome: profile.nome || null,
    };
  }

  // 2) Comportamental (prosa, não rótulos STAR)
  const historia = melhorHistoria(pergunta, comportamental.historias);
  if (historia) {
    return {
      status: "ok",
      texto: formatarHistoriaProsa(historia),
      fonte: `historia:${historia.id}`,
      nome: profile.nome || null,
    };
  }

  // 3) Pitch / sobre você
  const sobre = respostaSobreMim(pergunta, ctx);
  if (sobre) {
    return {
      status: "ok",
      texto: sobre.texto,
      fonte: sobre.fonte,
      nome: profile.nome || null,
    };
  }

  // 4) Fallback curto e útil
  if (padrao.observacao_padrao) {
    return {
      status: "ok",
      texto: limparBloco(padrao.observacao_padrao),
      fonte: "padrao_fallback",
      nome: profile.nome || null,
    };
  }

  return {
    status: "ok",
    texto:
      "Não encontrei uma resposta pronta para essa pergunta nos seus dados. Se for comportamental, cadastre em respostas/comportamental.yml; se for dado fixo, em respostas/padrao.yml.",
    fonte: "vazio",
    nome: profile.nome || null,
  };
}
