const statusEl = document.getElementById("status");
const msgEl = document.getElementById("msg");
const btnDetectar = document.getElementById("detectar");
const btnPreencher = document.getElementById("preencher");
const btnCurriculo = document.getElementById("curriculo");

function setMsg(texto, tipo = "") {
  if (!texto) {
    msgEl.hidden = true;
    msgEl.textContent = "";
    msgEl.className = "msg";
    return;
  }
  msgEl.hidden = false;
  msgEl.textContent = texto;
  msgEl.className = `msg ${tipo}`.trim();
}

function setBusy(busy) {
  btnDetectar.disabled = busy;
  btnPreencher.disabled = busy;
  btnCurriculo.disabled = busy;
}

async function atualizarStatus() {
  const res = await chrome.runtime.sendMessage({ type: "TUMA_PING" });
  if (res?.ok) {
    statusEl.textContent = "Online";
    statusEl.className = "status ok";
    setBusy(false);
    return;
  }

  statusEl.textContent = "Offline";
  statusEl.className = "status err";
  setBusy(true);
  btnDetectar.disabled = true;
  btnPreencher.disabled = true;
  btnCurriculo.disabled = true;
  setMsg("Site offline", "err");
}

async function abaAtiva() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function enviarAba(tabId, type, payload) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type, payload }, (res) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: "Recarregue a página" });
        return;
      }
      resolve(res ?? { ok: false });
    });
  });
}

btnDetectar.addEventListener("click", async () => {
  setMsg("");
  setBusy(true);
  const tab = await abaAtiva();
  if (!tab?.id) {
    setMsg("Aba inválida", "err");
    setBusy(false);
    return;
  }
  const res = await enviarAba(tab.id, "TUMA_DETECTAR_PAGINA");
  setBusy(false);
  if (!res.ok) {
    setMsg(res.error ?? "Falha", "err");
    return;
  }
  setMsg("Painel aberto na página", "ok");
});

btnPreencher.addEventListener("click", async () => {
  setMsg("");
  setBusy(true);
  const tab = await abaAtiva();
  if (!tab?.id) {
    setMsg("Aba inválida", "err");
    setBusy(false);
    return;
  }
  const res = await enviarAba(tab.id, "TUMA_ACAO_PREENCHER", { executar: true });
  setBusy(false);
  if (!res.ok) {
    setMsg(res.error ?? "Falha", "err");
    return;
  }
  setMsg("Completando formulário…", "ok");
});

btnCurriculo.addEventListener("click", async () => {
  setMsg("");
  setBusy(true);
  const tab = await abaAtiva();
  if (!tab?.id) {
    setMsg("Aba inválida", "err");
    setBusy(false);
    return;
  }
  const res = await enviarAba(tab.id, "TUMA_ACAO_CURRICULO", { executar: true });
  setBusy(false);
  if (!res.ok) {
    setMsg(res.error ?? "Falha", "err");
    return;
  }
  setMsg("Gerando currículo…", "ok");
});

atualizarStatus();
