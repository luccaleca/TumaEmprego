importScripts("config.js");

async function pingSite() {
  const res = await fetch(`${TUMA_CONFIG.siteUrl}/api/extensao/ping`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Site offline");
  return res.json();
}

async function classificarVaga(payload) {
  const res = await fetch(`${TUMA_CONFIG.siteUrl}/api/curriculo/vaga/classificar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vaga_titulo: payload.vaga_titulo ?? "",
      vaga_descricao: payload.vaga_descricao ?? "",
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { ok: false, error: data.error ?? data.detail ?? "Falha ao classificar" };
  }

  return { ok: true, ...data };
}

async function gerarPacote(payload) {
  const res = await fetch(`${TUMA_CONFIG.siteUrl}/api/curriculo/vaga/pacote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vaga_titulo: payload.vaga_titulo ?? "",
      vaga_descricao: payload.vaga_descricao ?? "",
      vaga_url: payload.vaga_url ?? "",
      segmento_slug: payload.segmento_slug ?? "",
      gerar_pdf: true,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { ok: false, error: data.error ?? data.detail ?? "Falha na API" };
  }

  return { ok: true, ...data };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "TUMA_PING") {
    pingSite()
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (msg?.type === "TUMA_CLASSIFICAR_VAGA") {
    classificarVaga(msg.payload ?? {})
      .then(sendResponse)
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (msg?.type === "TUMA_GERAR_PACOTE") {
    gerarPacote(msg.payload ?? {})
      .then(sendResponse)
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});
