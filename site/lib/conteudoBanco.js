/**
 * Consultas ao banco de conteúdo (dados/conteudo/banco.yml) para montar CVs.
 */

import { getConteudoBanco } from "./dados.js";
import { competenciasPerfil } from "./perfilCvSegmento.js";
import { segmentoEstaAtivo } from "./segmentosAtivos.js";
import { getFonteCandidato, termosParaSegmento } from "./fonteCandidato.js";

export { LABELS_SEGMENTO, slugParaLabel } from "./conteudoConstants.js";

export function loadBanco() {
  return getConteudoBanco();
}

/** Texto do bullet para um segmento (reframe opcional por área). */
export function textoBulletParaSegmento(bullet, slug) {
  return bullet?.texto_por_segmento?.[slug]?.trim() || bullet?.texto?.trim() || "";
}

function segmentoAtivo(item, slug) {
  if (!segmentoEstaAtivo(slug)) return false;
  return (item?.segmentos ?? []).includes(slug);
}

export function experienciaParaSegmento(banco, slug) {
  const exp = (banco?.experiencias ?? []).find((e) => segmentoAtivo(e, slug));
  if (!exp) return null;

  const titulo = exp.titulo_por_segmento?.[slug] ?? `${exp.empresa}`;
  const nota = exp.nota_por_segmento?.[slug] ?? "";
  const bullets = (exp.bullets ?? [])
    .filter((b) => (b.segmentos ?? []).includes(slug))
    .map((b) => textoBulletParaSegmento(b, slug))
    .filter(Boolean);

  return {
    titulo,
    nota,
    periodo: exp.periodo,
    local: exp.local,
    bullets,
  };
}

export function projetosParaSegmento(banco, slug, fallbackOrdem = []) {
  const lista = (banco?.projetos ?? []).filter((p) => segmentoAtivo(p, slug));

  if (!lista.length && fallbackOrdem.length) {
    return fallbackOrdem.map((nome, i) => ({
      nome,
      ordem: i + 1,
      subtitulo: "",
      stack: "",
      bullets: [],
    }));
  }

  return lista
    .map((p) => ({
      nome: p.nome,
      ordem: p.ordem_por_segmento?.[slug] ?? 99,
      subtitulo: p.subtitulo_por_segmento?.[slug] ?? "",
      stack: p.stack_por_segmento?.[slug] ?? "",
      bullets: p.bullets_por_segmento?.[slug] ?? [],
    }))
    .sort((a, b) => a.ordem - b.ordem);
}

export function formatarBlocoProjeto(proj) {
  const titulo = proj.subtitulo ? `${proj.nome} — ${proj.subtitulo}` : proj.nome;
  const stackLine = proj.stack ? `\n\n**Stack:** ${proj.stack}` : "";
  const bullets = (proj.bullets ?? []).map((b) => `- ${b}`).join("\n");
  return `### ${titulo}${stackLine}\n\n${bullets}`;
}

export function cursosParaSegmento(banco, slug) {
  return (banco?.cursos ?? [])
    .filter((c) => segmentoAtivo(c, slug))
    .sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99))
    .map((c) => {
      const partes = [c.titulo];
      if (c.instrutor) partes.push(c.instrutor);
      const sufixo = c.plataforma ? ` (${c.plataforma})` : "";
      return `- ${partes.join(" — ")}${sufixo}`;
    });
}

export function ferramentasParaSegmento(banco, slug) {
  return (banco?.ferramentas ?? []).filter((f) => segmentoAtivo(f, slug));
}

function agruparFerramentas(ferramentas) {
  const map = new Map();
  for (const f of ferramentas) {
    const cat = f.categoria?.trim() || "Ferramentas";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(f.nome);
  }
  return map;
}

function enriquecerComTecnologiasPerfil(body, slug, fonte) {
  const f = fonte ?? getFonteCandidato();
  const termos = termosParaSegmento(slug, f);
  if (!termos.length) return body;

  const lower = body.toLowerCase();
  const faltando = termos.filter((t) => !lower.includes(String(t).toLowerCase()));
  if (!faltando.length) return body;

  const niveis = (f.tecnologias?.comNivel ?? [])
    .filter((t) => faltando.some((x) => x.toLowerCase() === t.nome.toLowerCase()))
    .map((t) => `${t.nome} (${t.nivel})`);

  const semNivel = faltando.filter(
    (t) => !niveis.some((n) => n.toLowerCase().startsWith(t.toLowerCase())),
  );

  const extras = [...niveis, ...semNivel];
  if (!extras.length) return body;

  const linha = `- **Stack (perfil):** ${extras.join(", ")}`;
  if (body.includes("**Idiomas:**")) {
    return body.replace(/- \*\*Idiomas:\*\*/, `${linha}\n- **Idiomas:**`);
  }
  return `${body.trim()}\n${linha}`;
}

export function competenciasDoBanco(banco, slug, fonte = null) {
  const ferramentas = ferramentasParaSegmento(banco, slug);
  let body;

  if (ferramentas.length) {
    const grupos = agruparFerramentas(ferramentas);
    const lines = [...grupos.entries()].map(
      ([cat, nomes]) => `- **${cat}:** ${nomes.join(", ")}`,
    );
    lines.push("- **Idiomas:** Português (nativo), Inglês (avançado), Espanhol (básico)");
    body = lines.join("\n");
  } else {
    const texto = banco?.competencias?.[slug];
    body = texto?.trim() ? texto.trim() : competenciasPerfil({ slug });
  }

  return enriquecerComTecnologiasPerfil(body, slug, fonte);
}
