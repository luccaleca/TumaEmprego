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
      vaga_url: payload.vaga_url ?? "",
      portal: payload.portal ?? "",
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
      vaga_empresa: payload.vaga_empresa ?? "",
      vaga_descricao: payload.vaga_descricao ?? "",
      vaga_url: payload.vaga_url ?? "",
      segmento_slug: payload.segmento_slug ?? "",
      portal: payload.portal ?? "",
      formato: payload.formato ?? "auto",
      gerar_pdf: true,
      via_extensao: true,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { ok: false, error: data.error ?? data.detail ?? "Falha na API" };
  }

  return { ok: true, ...data };
}

async function buscarAutofill(payload) {
  const params = new URLSearchParams();
  if (payload?.segmento_slug) params.set("segmento_slug", payload.segmento_slug);
  if (payload?.portal) params.set("portal", payload.portal);
  const q = params.toString() ? `?${params}` : "";
  const res = await fetch(`${TUMA_CONFIG.siteUrl}/api/extensao/autofill${q}`, {
    method: "GET",
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error ?? data.detail ?? "Falha no autofill" };
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

  if (msg?.type === "TUMA_AUTOFILL_DADOS") {
    buscarAutofill(msg.payload ?? {})
      .then(sendResponse)
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});
