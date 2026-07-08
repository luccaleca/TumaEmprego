const PAINEL_ID = "tuma-emprego-painel";

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

function painelPrevia(classificacao, vaga) {
  const titulo = classificacao.vaga_titulo || vaga.titulo || "Vaga detectada";
  const slotInicial = slotSegmentoInicial(classificacao);

  montarPainel(
    `
    <div class="head">
      <div>
        <p class="title">${esc(titulo)}</p>
        <p class="meta">Base sugerida: <strong>${esc(classificacao.segmento_label)}</strong></p>
        <span class="badge">Revise o segmento antes de gerar</span>
      </div>
      <button type="button" class="close">Fechar</button>
    </div>
    <div class="field">
      <label for="tuma-segmento">Segmento do currículo</label>
      <select id="tuma-segmento" aria-label="Segmento do currículo">
        ${opcoesSegmento(classificacao.segmentos, slotInicial)}
      </select>
    </div>
    <div class="actions">
      <button type="button" class="primary" id="tuma-gerar">Gerar currículo</button>
    </div>
  `,
    (shadow, host) => {
      host._tumaVaga = vaga;
      host._tumaClassificacao = classificacao;

      shadow.getElementById("tuma-gerar")?.addEventListener("click", () => {
        const segmento_slug = shadow.getElementById("tuma-segmento")?.value ?? slotInicial;
        gerarCurriculo(vaga, segmento_slug);
      });
    },
  );
}

function painelSucesso(data) {
  const segmento = data.segmento_label ?? data.segmento_slug ?? "—";
  const titulo = data.pacote?.pedido?.vaga_titulo ?? data.segmentacao?.vaga_titulo ?? "Vaga";
  const siteUrl = data.revisarUrl ?? "";

  montarPainel(`
    <div class="head">
      <div>
        <p class="title">${esc(titulo)}</p>
        <p class="meta">Segmento: ${esc(segmento)} · currículo gerado</p>
      </div>
      <button type="button" class="close">Fechar</button>
    </div>
    <div class="actions">
      ${
        siteUrl
          ? `<a class="primary" href="${esc(siteUrl)}" target="_blank" rel="noopener">Abrir no site</a>`
          : `<span class="meta">Abra localhost:3737/vaga</span>`
      }
    </div>
  `);
}

function enviarMensagem(tipo, payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, payload }, (res) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(res ?? { ok: false });
    });
  });
}

async function gerarCurriculo(vaga, segmento_slug) {
  painelCarregando("Gerando currículo…");

  const res = await enviarMensagem("TUMA_GERAR_PACOTE", {
    vaga_titulo: vaga.titulo,
    vaga_descricao: vaga.descricao,
    vaga_url: vaga.url,
    segmento_slug,
  });

  if (!res.ok) {
    painelErro(res.error ?? "Erro ao gerar currículo.");
    return res;
  }

  painelSucesso(res);
  return res;
}

async function detectarVagaNaPagina() {
  const vaga = extrairVagaDaPagina();

  if (!vaga.descricao || vaga.descricao.length < 20) {
    painelErro("Não achei descrição suficiente nesta página.");
    return { ok: false, error: "sem_descricao", etapa: "extrair" };
  }

  painelCarregando("Lendo vaga…");

  const classificacao = await enviarMensagem("TUMA_CLASSIFICAR_VAGA", {
    vaga_titulo: vaga.titulo,
    vaga_descricao: vaga.descricao,
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

  if (msg?.type === "TUMA_EXTRAIR_VAGA") {
    sendResponse({ ok: true, vaga: extrairVagaDaPagina() });
    return;
  }
});

criarBotaoFlutuante();
