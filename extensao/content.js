const PAINEL_ID = "tuma-emprego-painel";
let gerandoCurriculo = false;

const PAINEL_STYLES = `
  .card {
    background: #fff;
    border: 1px solid #e4e4e7;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    padding: 12px;
    font-size: 13px;
    color: #18181b;
  }
  .title { font-weight: 600; margin: 0 0 6px; line-height: 1.35; }
  .meta { color: #71717a; font-size: 11px; margin: 0 0 8px; line-height: 1.4; }
  .err { color: #dc2626; font-size: 12px; margin: 0; }
  .field { margin-top: 10px; }
  .field label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: #52525b;
    margin-bottom: 4px;
  }
  select {
    width: 100%;
    border: 1px solid #d4d4d8;
    border-radius: 8px;
    padding: 7px 8px;
    font-size: 12px;
    background: #fafafa;
    color: #18181b;
  }
  .actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
  a, button.link {
    appearance: none;
    border: 1px solid #d4d4d8;
    background: #fafafa;
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12px;
    cursor: pointer;
    text-decoration: none;
    color: #18181b;
  }
  a.primary, button.primary {
    background: #059669;
    border-color: #059669;
    color: #fff;
    font-weight: 600;
  }
  button.primary:disabled {
    opacity: 0.55;
    cursor: wait;
  }
  button.close {
    border: none;
    background: transparent;
    color: #71717a;
    padding: 0;
    margin-left: auto;
    cursor: pointer;
    font-size: 11px;
  }
  .head { display: flex; align-items: start; gap: 8px; }
  .badge {
    display: inline-block;
    margin-top: 6px;
    padding: 2px 6px;
    border-radius: 6px;
    background: #ecfdf5;
    color: #047857;
    font-size: 10px;
    font-weight: 600;
  }
  .badge-portal {
    display: inline-block;
    margin-top: 4px;
    margin-right: 4px;
    padding: 2px 6px;
    border-radius: 6px;
    background: #f5f3ff;
    color: #6d28d9;
    font-size: 10px;
    font-weight: 600;
  }
  .badge-portal.planejado {
    background: #f4f4f5;
    color: #71717a;
  }
`;

function esc(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function criarBotaoFlutuante() {
  if (document.getElementById("tuma-emprego-fab")) return;

  const btn = document.createElement("button");
  btn.id = "tuma-emprego-fab";
  btn.type = "button";
  btn.title = "Tuma Emprego — detectar vaga";
  btn.setAttribute("aria-label", "Tuma Emprego — detectar vaga");

  const icon = document.createElement("img");
  icon.src = chrome.runtime.getURL("icons/icon48.png");
  icon.alt = "";
  icon.style.display = "block";

  Object.assign(btn.style, {
    position: "fixed",
    right: "16px",
    bottom: "16px",
    zIndex: "2147483646",
    width: "52px",
    height: "52px",
    borderRadius: "12px",
    border: "none",
    padding: "0",
    background: "transparent",
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(0,0,0,0.22)",
    lineHeight: "0",
    overflow: "hidden",
  });

  icon.width = 52;
  icon.height = 52;
  icon.style.borderRadius = "12px";

  btn.appendChild(icon);
  btn.addEventListener("click", () => detectarVagaNaPagina());
  document.documentElement.appendChild(btn);
}

function removerPainel() {
  document.getElementById(PAINEL_ID)?.remove();
}

function montarPainel(html, onReady) {
  removerPainel();

  const host = document.createElement("div");
  host.id = PAINEL_ID;
  Object.assign(host.style, {
    position: "fixed",
    right: "16px",
    bottom: "68px",
    zIndex: "2147483647",
    width: "min(320px, calc(100vw - 32px))",
    fontFamily: "system-ui, sans-serif",
  });

  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `<style>${PAINEL_STYLES}</style><div class="card">${html}</div>`;

  shadow.querySelector(".close")?.addEventListener("click", removerPainel);
  onReady?.(shadow, host);
  document.documentElement.appendChild(host);
  return shadow;
}

function painelCarregando(titulo) {
  montarPainel(`
    <div class="head">
      <p class="title">${esc(titulo)}</p>
      <button type="button" class="close">Fechar</button>
    </div>
  `);
}

function painelErro(mensagem) {
  montarPainel(`
    <div class="head">
      <div>
        <p class="title">Não deu</p>
        <p class="err">${esc(mensagem)}</p>
      </div>
      <button type="button" class="close">Fechar</button>
    </div>
  `);
}

function slotSegmentoInicial(classificacao) {
  const slugCanon = classificacao.segmento_slug;
  const lista = classificacao.segmentos ?? [];
  const exato = lista.find((s) => s.slug === slugCanon);
  if (exato) return exato.slug;
  const sugerido = lista.find((s) => s.sugerido);
  if (sugerido) return sugerido.slug;
  return slugCanon;
}

function opcoesSegmento(segmentos, selecionado) {
  return (segmentos ?? [])
    .map((seg) => {
      const marca = seg.sugerido ? " ★" : "";
      const inativo = seg.ativo === false ? " (inativo)" : "";
      const score = seg.score > 0 ? ` · ${seg.score}` : "";
      const selected = seg.slug === selecionado ? " selected" : "";
      return `<option value="${esc(seg.slug)}"${selected}>${esc(seg.label)}${score}${marca}${inativo}</option>`;
    })
    .join("");
}

function badgePortal(classificacao, vaga) {
  const portal = classificacao.portal ?? detectarPortalPorUrl(vaga?.url);
  if (!portal) return "";

  const nome = classificacao.portal_nome ?? PORTAIS_NOMES?.[portal] ?? portal;
  const ativo =
    classificacao.portal_motor_ativo === true ||
    portal === "solides" ||
    portal === "gupy";
  const cls = ativo ? "badge-portal" : "badge-portal planejado";

  return `<span class="${cls}">${esc(nome)}</span>`;
}

/** Gupy = estrutura do portal; não gera CV ATS. */
function portalSoEstrutura(portal) {
  return String(portal || "").toLowerCase() === "gupy";
}

function painelAcoesManuais({ primaryPreencher = true } = {}) {
  if (primaryPreencher) {
    return `
    <div class="actions">
      <button type="button" class="primary" id="tuma-preencher">Completar formulário</button>
      <button type="button" class="link" id="tuma-gerar">Fazer currículo</button>
    </div>`;
  }
  return `
    <div class="actions">
      <button type="button" class="primary" id="tuma-gerar">Fazer currículo</button>
      <button type="button" class="link" id="tuma-preencher">Completar formulário</button>
    </div>`;
}

function ligarAcoesPainel(shadow, { segmento_slug, vaga, classificacao, portal }) {
  shadow.getElementById("tuma-gerar")?.addEventListener("click", () => {
    const slug =
      shadow.getElementById("tuma-segmento")?.value ?? segmento_slug ?? "";
    gerarCurriculo(vaga, slug, classificacao);
  });

  shadow.getElementById("tuma-preencher")?.addEventListener("click", () => {
    const slug =
      shadow.getElementById("tuma-segmento")?.value ?? segmento_slug ?? "";
    preencherFormularioPagina(slug, portal || classificacao?.portal || "");
  });
}

function painelPrevia(classificacao, vaga) {
  const titulo = classificacao.vaga_titulo || vaga.titulo || "Vaga detectada";
  const slotInicial = slotSegmentoInicial(classificacao);
  const portalBadge = badgePortal(classificacao, vaga);
  const portal = classificacao.portal ?? detectarPortalPorUrl(vaga?.url) ?? "";
  // Gupy: completar formulário em 1º; outros portais: currículo em 1º
  const priorizarPreencher = portalSoEstrutura(portal);

  montarPainel(
    `
    <div class="head">
      <div>
        <p class="title">${esc(titulo)}</p>
        <p class="meta">${esc(classificacao.segmento_label)}</p>
        ${portalBadge}
      </div>
      <button type="button" class="close">Fechar</button>
    </div>
    <div class="field">
      <label for="tuma-segmento">Segmento</label>
      <select id="tuma-segmento" aria-label="Segmento">
        ${opcoesSegmento(classificacao.segmentos, slotInicial)}
      </select>
    </div>
    ${painelAcoesManuais({ primaryPreencher: priorizarPreencher })}
  `,
    (shadow, host) => {
      host._tumaVaga = vaga;
      host._tumaClassificacao = classificacao;
      ligarAcoesPainel(shadow, {
        segmento_slug: slotInicial,
        vaga,
        classificacao,
        portal,
      });
    },
  );
}

function painelSucesso(data) {
  const segmento = data.segmento_label ?? data.segmento_slug ?? "—";
  const titulo = data.pacote?.pedido?.vaga_titulo ?? data.segmentacao?.vaga_titulo ?? "Vaga";
  const siteUrl = data.revisarUrl ?? "";
  const formato =
    data.formato_gerado === "solides"
      ? "Sólides"
      : data.formato_gerado === "ats"
        ? "ATS"
        : data.so_estrutura
          ? "Estrutura"
          : data.portal_nome ?? "—";

  montarPainel(
    `
    <div class="head">
      <div>
        <p class="title">${esc(titulo)}</p>
        <p class="meta">Segmento: ${esc(segmento)} · ${esc(formato)}</p>
      </div>
      <button type="button" class="close">Fechar</button>
    </div>
    <div class="actions">
      ${
        siteUrl
          ? `<a class="primary" href="${esc(siteUrl)}" target="_blank" rel="noopener">Abrir no site</a>`
          : ""
      }
      <button type="button" class="link" id="tuma-preencher">Completar formulário</button>
    </div>
  `,
    (shadow) => {
      shadow.getElementById("tuma-preencher")?.addEventListener("click", () => {
        const slug = data.segmento_slug ?? "";
        preencherFormularioPagina(slug, data.portal || "");
      });
    },
  );
}

function enviarMensagem(tipo, payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: tipo, payload }, (res) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(res ?? { ok: false });
    });
  });
}

async function preencherFormularioPagina(segmento_slug, portal = "") {
  painelCarregando("Buscando seus dados…");

  const portalDetectado = portal || detectarPortalPorUrl(location.href) || "";
  const res = await enviarMensagem("TUMA_AUTOFILL_DADOS", {
    segmento_slug,
    portal: portalDetectado,
  });
  if (!res.ok) {
    painelErro(res.error ?? "Não consegui carregar os dados de preenchimento.");
    return;
  }

  const resultado = await preencherFormularioComMapa(res);
  const n = resultado.preenchidos;

  montarPainel(`
    <div class="head">
      <div>
        <p class="title">Formulário</p>
        <p class="meta">${n} campo(s) com dados do Tuma. Revise e salve no portal.</p>
        ${
          n === 0
            ? `<p class="err">Nenhum campo casou com os rótulos desta página. Tente rolar até o formulário e clicar de novo.</p>`
            : ""
        }
      </div>
      <button type="button" class="close">Fechar</button>
    </div>
    <div class="actions">
      <button type="button" class="link" id="tuma-preencher-de-novo">Preencher de novo</button>
    </div>
  `, (shadow) => {
    shadow.getElementById("tuma-preencher-de-novo")?.addEventListener("click", () => {
      preencherFormularioPagina(segmento_slug);
    });
  });
}

async function gerarCurriculo(vaga, segmento_slug, classificacao = null) {
  if (gerandoCurriculo) return { ok: false, error: "ja_gerando" };
  gerandoCurriculo = true;

  try {
  // Sempre relê a página atual — JD fresca + dados do candidato no motor.
  const fresca = typeof extrairVagaDaPagina === "function" ? extrairVagaDaPagina() : null;
  const usarFresca =
    fresca?.descricao &&
    (!vaga?.descricao || fresca.descricao.length >= (vaga.descricao?.length ?? 0));
  const vagaEfetiva = usarFresca
    ? {
        titulo: fresca.titulo || vaga?.titulo || "",
        empresa: fresca.empresa || vaga?.empresa || "",
        descricao: fresca.descricao,
        url: fresca.url || vaga?.url || location.href,
      }
    : {
        titulo: vaga?.titulo || fresca?.titulo || "",
        empresa: vaga?.empresa || fresca?.empresa || "",
        descricao: vaga?.descricao || fresca?.descricao || "",
        url: vaga?.url || fresca?.url || location.href,
      };

  const portal =
    classificacao?.portal ?? detectarPortalPorUrl(vagaEfetiva?.url || location.href) ?? "";

  if (!vagaEfetiva.descricao || vagaEfetiva.descricao.length < 20) {
    painelErro("Não li a descrição da vaga nesta página.");
    return { ok: false, error: "descricao_curta" };
  }

  painelCarregando("Lendo a vaga e gerando currículo…");

  // Manual: sempre gera CV (ATS ou Sólides). Gupy + formato ats = CV para baixar.
  const formato = portal === "solides" ? "solides" : "ats";

  const res = await enviarMensagem("TUMA_GERAR_PACOTE", {
    vaga_titulo: vagaEfetiva.titulo,
    vaga_empresa: vagaEfetiva.empresa ?? "",
    vaga_descricao: vagaEfetiva.descricao,
    vaga_url: vagaEfetiva.url,
    segmento_slug,
    portal,
    formato,
  });

  if (!res.ok) {
    painelErro(res.error ?? "Erro ao gerar currículo.");
    return res;
  }

  if (res.so_estrutura && !res.formato_gerado) {
    painelErro("Este portal usa formulário próprio. Use Completar formulário.");
    return res;
  }

  painelSucesso(res);
  return res;
  } finally {
    gerandoCurriculo = false;
  }
}

async function detectarVagaNaPagina() {
  const vaga = extrairVagaDaPagina();
  const portalPagina = detectarPortalPorUrl(vaga?.url || location.href) || "";

  // Curriculum / apply sem JD longa: painel manual com as duas ações
  if (!vaga.descricao || vaga.descricao.length < 20) {
    montarPainel(
      `
      <div class="head">
        <div>
          <p class="title">${esc(vaga.titulo || "Página")}</p>
          <p class="meta">${esc(portalPagina || "Formulário")}</p>
        </div>
        <button type="button" class="close">Fechar</button>
      </div>
      ${painelAcoesManuais({ primaryPreencher: true })}
    `,
      (shadow) => {
        ligarAcoesPainel(shadow, {
          segmento_slug: "",
          vaga,
          classificacao: { portal: portalPagina },
          portal: portalPagina,
        });
      },
    );
    return { ok: true, etapa: "so_preencher", portal: portalPagina };
  }

  painelCarregando("Lendo vaga…");

  const classificacao = await enviarMensagem("TUMA_CLASSIFICAR_VAGA", {
    vaga_titulo: vaga.titulo,
    vaga_descricao: vaga.descricao,
    vaga_url: vaga.url,
    portal: portalPagina,
  });

  if (!classificacao.ok) {
    painelErro(classificacao.error ?? "Site local está rodando?");
    return { ok: false, error: classificacao.error, etapa: "classificar" };
  }

  painelPrevia(classificacao, vaga);
  return { ok: true, etapa: "previa", classificacao };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "TUMA_DETECTAR_PAGINA") {
    detectarVagaNaPagina().then(sendResponse);
    return true;
  }

  if (msg?.type === "TUMA_ACAO_PREENCHER") {
    (async () => {
      const det = await detectarVagaNaPagina();
      // painel aberto — usuário escolhe; se force, completa já
      if (msg.payload?.executar) {
        const slug =
          det?.classificacao?.segmento_slug ||
          slotSegmentoInicial(det?.classificacao || {}) ||
          "";
        const portal =
          det?.classificacao?.portal ||
          det?.portal ||
          detectarPortalPorUrl(location.href) ||
          "";
        await preencherFormularioPagina(slug, portal);
      }
      sendResponse(det);
    })();
    return true;
  }

  if (msg?.type === "TUMA_ACAO_CURRICULO") {
    (async () => {
      const vaga = extrairVagaDaPagina();
      const portal = detectarPortalPorUrl(vaga?.url || location.href) || "";
      let slug = "";
      let classificacao = { portal };

      if (vaga.descricao && vaga.descricao.length >= 20) {
        classificacao = await enviarMensagem("TUMA_CLASSIFICAR_VAGA", {
          vaga_titulo: vaga.titulo,
          vaga_descricao: vaga.descricao,
          vaga_url: vaga.url,
          portal,
        });
        if (!classificacao.ok) {
          sendResponse(classificacao);
          return;
        }
        slug = slotSegmentoInicial(classificacao);
        if (msg.payload?.executar) {
          await gerarCurriculo(vaga, slug, classificacao);
        } else {
          painelPrevia(classificacao, vaga);
        }
      } else {
        painelErro("Cole ou abra a vaga com descrição para gerar currículo.");
      }
      sendResponse({ ok: true, etapa: "curriculo" });
    })();
    return true;
  }

  if (msg?.type === "TUMA_EXTRAIR_VAGA") {
    sendResponse({ ok: true, vaga: extrairVagaDaPagina() });
    return;
  }
});

criarBotaoFlutuante();
