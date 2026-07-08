const statusEl = document.getElementById("status");
const msgEl = document.getElementById("msg");
const btn = document.getElementById("detectar");

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

async function atualizarStatus() {
  const res = await chrome.runtime.sendMessage({ type: "TUMA_PING" });
  if (res?.ok) {
    statusEl.textContent = "Online";
    statusEl.className = "status ok";
    btn.disabled = false;
    return;
  }

  statusEl.textContent = "Offline";
  statusEl.className = "status err";
  btn.disabled = true;
  setMsg("Rode o site em localhost:3737", "err");
}

btn.addEventListener("click", async () => {
  setMsg("");
  btn.disabled = true;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setMsg("Aba inválida", "err");
    btn.disabled = false;
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: "TUMA_DETECTAR_PAGINA" }, (res) => {
    btn.disabled = false;

    if (chrome.runtime.lastError) {
      setMsg("Recarregue a página da vaga e tente de novo", "err");
      return;
    }

    if (res?.ok) {
      if (res.etapa === "previa") {
        setMsg("Vaga lida — escolha o segmento no painel", "ok");
      } else {
        setMsg("Pronto — veja o painel na página", "ok");
      }
      return;
    }

    setMsg(res?.error ?? "Falha ao detectar", "err");
  });
});

atualizarStatus();
