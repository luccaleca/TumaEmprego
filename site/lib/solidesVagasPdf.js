/**
 * PDF do molde Sólides Vagas — só estrutura de campos (4 abas).
 */

import { ABAS_SOLIDES_VAGAS } from "./solidesVagasEstrutura.js";
import {
  camposPorAbaFromPacote,
  camposPorAbaVazios,
  MOLDE_SOLIDES_VAGAS_ID,
} from "./solidesVagasMolde.js";

function esc(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linhaVazia(altura = "1.6em") {
  return `<div class="blank" style="min-height:${altura}">&nbsp;</div>`;
}

function campoHtml({ label, valor, obrigatorio, vazio }) {
  const mark = obrigatorio ? ' <span class="req">*</span>' : "";
  let valorHtml;

  if (vazio) {
    valorHtml = linhaVazia(label.includes("Atividades") || label.includes("apresentação") ? "3.5em" : "1.6em");
  } else if (Array.isArray(valor)) {
    valorHtml = valor.length
      ? `<ul>${valor.map((v) => `<li>${esc(v)}</li>`).join("")}</ul>`
      : linhaVazia();
  } else if (valor && String(valor).includes("\n")) {
    valorHtml = `<div class="value multiline">${esc(valor).replace(/\n/g, "<br/>")}</div>`;
  } else if (valor) {
    valorHtml = `<div class="value">${esc(valor)}</div>`;
  } else {
    valorHtml = linhaVazia();
  }

  return `<div class="field" data-campo="${esc(label)}">
    <div class="label">${esc(label)}${mark}</div>
    ${valorHtml}
  </div>`;
}

const FORM_STYLES = `
  @page { size: A4; margin: 12mm 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", system-ui, sans-serif;
    font-size: 10pt;
    line-height: 1.4;
    color: #18181b;
    margin: 0;
  }
  h1 { font-size: 13pt; margin: 0 0 12px; font-weight: 700; }
  h2 {
    font-size: 11pt;
    font-weight: 700;
    color: #3f3f46;
    border-bottom: 1px solid #d4d4d8;
    padding-bottom: 4px;
    margin: 14px 0 8px;
    page-break-after: avoid;
  }
  .field { margin-bottom: 8px; page-break-inside: avoid; }
  .label { font-size: 9pt; font-weight: 600; color: #52525b; margin-bottom: 2px; }
  .req { color: #dc2626; }
  .value {
    border: 1px solid #e4e4e7;
    border-radius: 3px;
    padding: 5px 7px;
    background: #fafafa;
    font-size: 9.5pt;
    min-height: 1.3em;
  }
  .value.multiline { white-space: pre-wrap; }
  .blank { border-bottom: 1px solid #d4d4d8; margin-top: 2px; }
  ul { margin: 3px 0; padding-left: 1rem; }
  li { margin-bottom: 2px; }
  .block-title {
    font-size: 8.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #71717a;
    margin: 10px 0 4px;
  }
`;

function renderSobre(sobre, vazio) {
  const aba = ABAS_SOLIDES_VAGAS.find((a) => a.id === "sobre");
  return aba.campos
    .map((f) =>
      campoHtml({
        label: f.label,
        valor: sobre?.[f.id],
        obrigatorio: f.obrigatorio,
        vazio,
      }),
    )
    .join("");
}

function renderExperiencias(dados, vazio) {
  let html = campoHtml({
    label: "Resumo da trajetória profissional",
    valor: dados?.resumo_trajetoria,
    vazio,
  });

  const exps = vazio ? dados.itens : dados.itens?.length ? dados.itens : [];
  if (vazio && !exps.length) return html;

  exps.forEach((exp, i) => {
    html += `<p class="block-title">Experiência ${i + 1}</p>`;
    html += campoHtml({ label: "Cargo", valor: exp.cargo, obrigatorio: true, vazio });
    html += campoHtml({ label: "Empresa", valor: exp.empresa, obrigatorio: true, vazio });
    html += campoHtml({ label: "Data de início", valor: exp.inicio, obrigatorio: true, vazio });
    html += campoHtml({ label: "Data de término", valor: exp.fim, obrigatorio: true, vazio });
    html += campoHtml({ label: "Local", valor: exp.local, vazio });
    const atv = exp.atividades?.length ? exp.atividades.join("\n") : "";
    html += campoHtml({ label: "Atividades e resultados", valor: atv, vazio });
  });

  const forms = vazio ? dados.formacao : dados.formacao?.length ? dados.formacao : [];
  forms.forEach((form, i) => {
    html += `<p class="block-title">Formação ${i + 1}</p>`;
    html += campoHtml({
      label: "Grau de escolaridade / Curso",
      valor: form.grau_curso,
      obrigatorio: true,
      vazio,
    });
    html += campoHtml({ label: "Instituição", valor: form.instituicao, obrigatorio: true, vazio });
    html += campoHtml({ label: "Data de início", valor: form.inicio, obrigatorio: true, vazio });
    html += campoHtml({ label: "Data de término / Previsão", valor: form.fim, obrigatorio: true, vazio });
    if (!vazio && form.situacao) {
      html += campoHtml({ label: "Situação", valor: form.situacao, vazio: false });
    }
    if (!vazio && form.cidade) {
      html += campoHtml({ label: "Cidade", valor: form.cidade, vazio: false });
    }
  });

  html += campoHtml({
    label: "Cursos e certificações",
    valor: dados.cursos_certificacoes,
    vazio,
  });

  return html;
}

function renderHabilidades(dados, vazio) {
  let html = "";
  const habs = dados.itens ?? [];
  habs.forEach((h, i) => {
    html += `<p class="block-title">Habilidade ${i + 1}</p>`;
    html += campoHtml({ label: "Habilidade", valor: h.nome, obrigatorio: true, vazio });
    html += campoHtml({ label: "Nível", valor: h.nivel, obrigatorio: true, vazio });
  });

  const idiomas = dados.idiomas ?? [];
  idiomas.forEach((id, i) => {
    html += `<p class="block-title">Idioma ${i + 1}</p>`;
    html += campoHtml({ label: "Idioma", valor: id.idioma, vazio });
    html += campoHtml({ label: "Proficiência", valor: id.nivel, vazio });
  });

  return html;
}

function renderOutras(dados, vazio) {
  return campoHtml({
    label: "Campos exigidos pela empresa",
    valor: dados?.campos_empresa,
    vazio,
  });
}

/**
 * @param {{ pacote?: object, vazio?: boolean, titulo?: string }} opts
 */
export function buildSolidesVagasFormHtml({ pacote = null, vazio = false, titulo } = {}) {
  const dados = vazio ? camposPorAbaVazios() : camposPorAbaFromPacote(pacote ?? {});
  const docTitulo = titulo ?? (vazio ? "Sólides Vagas" : pacote?.vaga?.titulo || "Sólides Vagas");

  const abasHtml = ABAS_SOLIDES_VAGAS.map((aba) => {
    let corpo = "";
    if (aba.id === "sobre") corpo = renderSobre(dados.sobre, vazio);
    else if (aba.id === "experiencias") corpo = renderExperiencias(dados.experiencias, vazio);
    else if (aba.id === "habilidades") corpo = renderHabilidades(dados.habilidades, vazio);
    else if (aba.id === "outras-informacoes") corpo = renderOutras(dados["outras-informacoes"], vazio);

    return `<section data-aba="${esc(aba.id)}"><h2>${esc(aba.titulo)}</h2>${corpo}</section>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${esc(docTitulo)}</title>
  <style>${FORM_STYLES}</style>
</head>
<body data-molde="${MOLDE_SOLIDES_VAGAS_ID}">
  <h1>${esc(docTitulo)}</h1>
  ${abasHtml}
</body>
</html>`;
}

/** Markdown com mesmas abas/campos do PDF — para revisão e IA. */
export function markdownSolidesVagasForm(pacote) {
  const dados = camposPorAbaFromPacote(pacote);
  const titulo = pacote?.vaga?.titulo ?? "Vaga";
  const linhas = [`# ${titulo}`, ""];

  for (const aba of ABAS_SOLIDES_VAGAS) {
    linhas.push(`## ${aba.titulo}`, "");

    if (aba.id === "sobre") {
      for (const f of aba.campos) {
        const val = dados.sobre[f.id];
        if (!val && f.id === "cpf") continue;
        linhas.push(`**${f.label}**`, "", val ? String(val) : "", "");
      }
    } else if (aba.id === "experiencias") {
      if (dados.experiencias.resumo_trajetoria) {
        linhas.push("**Resumo da trajetória profissional**", "", dados.experiencias.resumo_trajetoria, "");
      }
      dados.experiencias.itens.forEach((exp, i) => {
        linhas.push(`### Experiência ${i + 1}`, "");
        linhas.push(`**Cargo:** ${exp.cargo}`, `**Empresa:** ${exp.empresa}`, "");
        if (exp.inicio || exp.fim) linhas.push(`**Período:** ${exp.inicio} – ${exp.fim}`, "");
        if (exp.local) linhas.push(`**Local:** ${exp.local}`, "");
        if (exp.atividades.length) {
          linhas.push("");
          exp.atividades.forEach((a) => linhas.push(`- ${a}`));
        }
        linhas.push("");
      });
      dados.experiencias.formacao.forEach((form, i) => {
        linhas.push(`### Formação ${i + 1}`, "");
        linhas.push(`**Curso:** ${form.grau_curso}`, `**Instituição:** ${form.instituicao}`, "");
        if (form.inicio) linhas.push(`**Período:** ${form.inicio} – ${form.fim || "—"}`, "");
        linhas.push("");
      });
      if (dados.experiencias.cursos_certificacoes.length) {
        linhas.push("**Cursos e certificações**", "");
        dados.experiencias.cursos_certificacoes.forEach((c) => linhas.push(`- ${c}`));
        linhas.push("");
      }
    } else if (aba.id === "habilidades") {
      dados.habilidades.itens.forEach((h) => {
        if (h.nome) linhas.push(`- ${h.nome} — ${h.nivel}`);
      });
      linhas.push("");
      dados.habilidades.idiomas.forEach((i) => {
        if (i.idioma) linhas.push(`- ${i.idioma} — ${i.nivel}`);
      });
      linhas.push("");
    } else {
      linhas.push("");
    }
  }

  return linhas.join("\n").trim() + "\n";
}

export { camposPorAbaFromPacote, camposPorAbaVazios, getMoldeSolidesVagasJson } from "./solidesVagasMolde.js";
