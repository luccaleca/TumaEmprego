/**
 * Preenche inputs/selects/combobox da página com o mapa do Tuma.
 * Tuma = fonte da verdade: limpa e sobrescreve o que já estiver no portal.
 */

function normalize(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function textoRotulo(el) {
  const partes = [];
  if (el.id) {
    partes.push(el.id.replace(/[-_]/g, " "));
    const lab = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (lab) partes.push(lab.innerText || lab.textContent);
  }
  const wrapped = el.closest("label");
  if (wrapped) partes.push(wrapped.innerText || wrapped.textContent);

  const aria = el.getAttribute("aria-label");
  if (aria) partes.push(aria);

  const labelled = el.getAttribute("aria-labelledby");
  if (labelled) {
    labelled.split(/\s+/).forEach((id) => {
      const n = document.getElementById(id);
      if (n) partes.push(n.innerText || n.textContent);
    });
  }

  const ph = el.getAttribute("placeholder");
  if (ph) partes.push(ph);

  const name = el.getAttribute("name");
  if (name) partes.push(name.replace(/[_-]/g, " "));

  let prev = el.parentElement;
  for (let i = 0; i < 4 && prev; i++) {
    const t = (prev.innerText || "").split("\n")[0];
    if (t && t.length < 220) partes.push(t);
    prev = prev.parentElement;
  }

  return normalize(partes.filter(Boolean).join(" | "));
}

function setNativeValue(el, value) {
  const proto =
    el.tagName === "SELECT"
      ? window.HTMLSelectElement.prototype
      : el.tagName === "TEXTAREA"
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, "value");
  if (desc?.set) desc.set.call(el, value);
  else el.value = value;

  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function limparCampo(el) {
  setNativeValue(el, "");
  // remove chips de autocomplete (Gupy/MUI)
  const root =
    el.closest(".MuiAutocomplete-root, [class*='Autocomplete'], [class*='autocomplete']") ||
    el.parentElement;
  if (root) {
    for (const btn of root.querySelectorAll(
      'button[aria-label*="Clear"], button[aria-label*="clear"], button[aria-label*="Remover"], button[aria-label*="Remove"], [data-testid*="CancelIcon"], .MuiChip-deleteIcon',
    )) {
      try {
        btn.click();
      } catch {
        /* ignore */
      }
    }
  }
}

function escolherOpcaoSelect(select, valor) {
  const alvo = normalize(valor);
  if (!alvo) return false;

  const opts = [...select.options];
  const hit =
    opts.find((o) => normalize(o.text) === alvo || normalize(o.value) === alvo) ||
    opts.find(
      (o) =>
        normalize(o.text).includes(alvo) ||
        (alvo.length > 3 && alvo.includes(normalize(o.text))),
    ) ||
    opts.find((o) => {
      const blob = normalize(o.text + " " + o.value);
      if (alvo.includes("intermediario") && /intermed/.test(blob)) return true;
      if (alvo.includes("avancado") && /avanc|advanced|fluent|domin/.test(blob)) return true;
      if (alvo === "sim" && /^(sim|yes)$/i.test(String(o.text).trim())) return true;
      if (alvo === "nao" && /^(n[aã]o|no)$/i.test(String(o.text).trim())) return true;
      if (alvo.includes("noturno") && /noturn|night|evening/.test(blob)) return true;
      if (alvo.includes("linkedin") && /linkedin/.test(blob)) return true;
      if (alvo.includes("em andamento") || alvo.includes("in progress")) {
        if (/progress|cursando|andamento|in progress/.test(blob)) return true;
      }
      if (alvo.includes("ensino superior") || alvo.includes("higher")) {
        if (/higher|superior|graduat/.test(blob)) return true;
      }
      if (alvo.includes("bacharel") || alvo.includes("undergrad")) {
        if (/undergrad|bachelor|bacharel|gradua/.test(blob)) return true;
      }
      return false;
    });

  if (!hit) return false;
  setNativeValue(select, hit.value);
  select.dispatchEvent(new Event("blur", { bubbles: true }));
  return true;
}

function aliasesValor(valor) {
  const alvo = normalize(valor);
  const lista = [alvo];

  if (/masculino|male|he \/ him|ele \/ dele/.test(alvo)) {
    lista.push("male", "masculino", "he / him", "he him", "ele / dele", "ele");
  }
  if (/feminino|female|she \/ her|ela /.test(alvo)) {
    lista.push("female", "feminino", "she / her", "ela / dela");
  }
  if (/cisgenero|cisgender|cis/.test(alvo)) lista.push("cisgender", "cisgenero", "cis");
  if (/heterossexual|heterosexual/.test(alvo)) lista.push("heterosexual", "heterossexual");
  if (/branco|white/.test(alvo)) lista.push("white", "branco");
  if (/ensino superior|higher degree|higher/.test(alvo)) {
    lista.push("higher degree", "ensino superior", "higher");
  }
  if (/ensino medio|high school/.test(alvo)) lista.push("high school", "ensino medio");
  if (/graduacao|undergraduate|bacharel/.test(alvo)) {
    lista.push("undergraduate", "graduacao", "bachelor");
  }
  if (/em andamento|in progress|cursando/.test(alvo)) {
    lista.push("in progress", "em andamento", "cursando");
  }
  if (/concluido|completed|conclu/.test(alvo)) lista.push("completed", "concluido");
  if (/^sim/.test(alvo)) lista.push("yes", "sim");
  if (/^nao|^não/.test(alvo)) lista.push("no", "nao", "não");
  if (/consent|compartilhar|agree/.test(alvo)) lista.push("agree", "i agree", "sim", "yes");
  if (/fluent|dominio|domínio|native/.test(alvo)) {
    lista.push("fluent", "dominio", "native", "native/fluent", "native fluent");
  }
  if (/advanced|avancado|avançado/.test(alvo)) lista.push("advanced", "avancado");
  if (/intermediate|intermed/.test(alvo)) lista.push("intermediate", "intermediario");
  if (/basic|basico|básico/.test(alvo)) lista.push("basic", "basico");

  const meses = [
    ["january", "janeiro", "01", "1"],
    ["february", "fevereiro", "02", "2"],
    ["march", "marco", "03", "3"],
    ["april", "abril", "04", "4"],
    ["may", "maio", "05", "5"],
    ["june", "junho", "06", "6"],
    ["july", "julho", "07", "7"],
    ["august", "agosto", "08", "8"],
    ["september", "setembro", "09", "9"],
    ["october", "outubro", "10"],
    ["november", "novembro", "11"],
    ["december", "dezembro", "12"],
  ];
  for (const grupo of meses) {
    if (grupo.some((x) => alvo === x || alvo === normalize(x))) {
      lista.push(...grupo);
    }
  }

  return [...new Set(lista.filter(Boolean))];
}

function preencherRadioOuCheckbox(el, valor) {
  const type = (el.getAttribute("type") || "").toLowerCase();
  const alvos = aliasesValor(valor);

  if (type === "checkbox") {
    const on = alvos.some(
      (a) => /^(sim|yes|true|1)$/.test(a) || a.includes("agree") || a.includes("consent"),
    );
    if (el.checked !== on) el.click();
    return true;
  }

  if (type !== "radio") return false;

  const name = el.getAttribute("name");
  const grupo = name
    ? [...document.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`)]
    : [el];

  for (const r of grupo) {
    const rotulo = textoRotulo(r) || normalize(r.value);
    if (alvos.some((a) => rotulo.includes(a) || a.includes(rotulo) || normalize(r.value) === a)) {
      if (!r.checked) r.click();
      return true;
    }
  }

  const binario = alvos.some((a) => /^(sim|yes)$/.test(a));
  const negativo = alvos.some((a) => /^(nao|não|no)$/.test(a));
  if (binario || negativo) {
    for (const r of grupo) {
      const rotulo = textoRotulo(r) || normalize(r.value);
      if (binario && /^(sim|yes)$/.test(rotulo)) {
        if (!r.checked) r.click();
        return true;
      }
      if (negativo && /^(nao|não|no)$/.test(rotulo)) {
        if (!r.checked) r.click();
        return true;
      }
    }
  }

  return false;
}

function ehCombobox(el) {
  const role = (el.getAttribute("role") || "").toLowerCase();
  if (role === "combobox") return true;
  if (el.getAttribute("aria-autocomplete")) return true;
  if (el.getAttribute("aria-haspopup") === "listbox") return true;
  const id = String(el.id || "").toLowerCase();
  if (id.includes("autocomplete") || id.includes("search")) return true;
  return false;
}

function campoPreenchivel(el, forcar = false) {
  if (!el || el.disabled) return false;
  if (el.readOnly && !forcar) return ehCombobox(el) || el.tagName === "SELECT";
  return true;
}

async function preencherCampoForcado(el, valor, campo = {}) {
  if (!el) return false;
  const wasReadOnly = Boolean(el.readOnly);
  const wasDisabled = Boolean(el.disabled);
  try {
    if (wasReadOnly) el.readOnly = false;
    if (wasDisabled) el.disabled = false;
    return await preencherCampo(el, valor, campo);
  } finally {
    try {
      if (wasReadOnly) el.readOnly = true;
      if (wasDisabled) el.disabled = true;
    } catch {
      /* ignore */
    }
  }
}

function listarOpcoesVisiveis() {
  const sels = [
    '[role="option"]',
    '[role="listbox"] [role="option"]',
    "ul[role='listbox'] li",
    ".MuiAutocomplete-option",
  ];
  const seen = new Set();
  const out = [];
  for (const sel of sels) {
    for (const o of document.querySelectorAll(sel)) {
      if (seen.has(o)) continue;
      const style = window.getComputedStyle(o);
      if (style.display === "none" || style.visibility === "hidden") continue;
      seen.add(o);
      out.push(o);
    }
  }
  return out;
}

function opcaoCasa(textoOpcao, alvos) {
  const t = normalize(textoOpcao);
  if (!t) return false;
  if (alvos.some((a) => a && t === a)) return true;

  const querBasico = alvos.some((a) => /^(basico|basic|bas)$/.test(a));
  if (querBasico && /nativ|fluent|avanc|advanced|intermed|domini/.test(t)) return false;

  const querFluent = alvos.some((a) => /^(fluent|dominio)$/.test(a));
  if (querFluent && /nativ/.test(t) && !/fluent/.test(t)) return false;

  return alvos.some((a) => a && a.length >= 4 && (t.includes(a) || a.includes(t)));
}

async function aguardarOpcoes(timeoutMs = 1400) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const opts = listarOpcoesVisiveis();
    if (opts.length) return opts;
    await sleep(80);
  }
  return listarOpcoesVisiveis();
}

function melhorOpcao(opts, alvos) {
  const querBasico = alvos.some((a) => /^(basico|basic|bas)$/.test(a));
  const querAdvanced = alvos.some((a) => /^(avancado|advanced)$/.test(a));
  const querFluent = alvos.some((a) => /^(fluent|dominio)$/.test(a));

  let melhor = null;
  let melhorScore = 0;

  for (const o of opts) {
    const t = normalize(o.innerText || o.textContent);
    if (!t) continue;

    if (querBasico && /nativ|fluent|avanc|advanced|intermed|domini/.test(t)) continue;
    if (querAdvanced && /nativ|fluent|basic|basico|intermed/.test(t) && !/avanc|advanced/.test(t)) {
      continue;
    }
    if (querFluent && /nativ/.test(t) && !/fluent/.test(t)) continue;

    let score = 0;
    if (alvos.some((a) => a && t === a)) score = 100;
    else if (alvos.some((a) => a && (t.startsWith(a) || a.startsWith(t)))) score = 60;
    else if (opcaoCasa(t, alvos)) score = 20;

    if (score > melhorScore) {
      melhorScore = score;
      melhor = o;
    }
  }

  return melhor;
}

async function preencherCombobox(el, valor, aliasesExtras = []) {
  const v = String(valor ?? "").trim();
  if (!v) return false;

  const alvos = [...aliasesValor(v), ...aliasesExtras.map(normalize)];

  el.scrollIntoView({ block: "center", behavior: "instant" });
  el.focus();
  el.click();
  await sleep(50);

  limparCampo(el);
  await sleep(40);

  if (String(el.value || "").trim()) {
    el.select?.();
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Backspace", bubbles: true, cancelable: true }),
    );
    setNativeValue(el, "");
    await sleep(40);
  }

  for (const ch of v) {
    setNativeValue(el, (el.value || "") + ch);
    el.dispatchEvent(new KeyboardEvent("keydown", { key: ch, bubbles: true, cancelable: true }));
    el.dispatchEvent(new KeyboardEvent("keyup", { key: ch, bubbles: true, cancelable: true }));
    await sleep(18);
  }

  await sleep(120);
  const opts = await aguardarOpcoes(1600);
  const hit = melhorOpcao(opts, alvos);

  if (hit) {
    hit.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    hit.click();
    await sleep(80);
    el.dispatchEvent(new Event("blur", { bubbles: true }));
    return true;
  }

  // não dá Enter/ArrowDown às cegas — isso pega Native/Fluent errado
  el.dispatchEvent(new Event("blur", { bubbles: true }));
  return false;
}

async function preencherCampo(el, valor, campo = {}) {
  const v = String(valor ?? "").trim();
  if (!v) return false;

  if (el.tagName === "SELECT") return escolherOpcaoSelect(el, v);

  const type = (el.getAttribute("type") || "text").toLowerCase();
  if (["checkbox", "radio"].includes(type)) {
    return preencherRadioOuCheckbox(el, v);
  }
  if (type === "file") return false;

  const tipo = String(campo.tipo || "").toLowerCase();
  const aliases = Array.isArray(campo.aliases) ? campo.aliases : [];

  if (tipo === "combobox" || tipo === "autocomplete" || ehCombobox(el)) {
    return preencherCombobox(el, v, aliases);
  }

  limparCampo(el);
  setNativeValue(el, v);
  el.dispatchEvent(new Event("blur", { bubbles: true }));
  return true;
}

function encontrarPorMatchIds(matchIds, usados, forcar = false) {
  for (const raw of matchIds || []) {
    const idPat = String(raw || "").trim();
    if (!idPat) continue;

    let el = document.getElementById(idPat);
    if (el && !usados.has(el) && campoPreenchivel(el, forcar)) return el;

    const prefix = [...document.querySelectorAll(`[id^="${CSS.escape(idPat)}"]`)].find(
      (e) => !usados.has(e) && campoPreenchivel(e, forcar) && !/arrow-close/i.test(e.id || ""),
    );
    if (prefix) return prefix;

    const byName = [
      ...document.querySelectorAll(
        `[name="${CSS.escape(idPat)}"], [name^="${CSS.escape(idPat)}"]`,
      ),
    ].find((e) => !usados.has(e) && campoPreenchivel(e, forcar));
    if (byName) return byName;
  }
  return null;
}

/** Datas Gupy: Start/End com name monthValue/yearValue; escopo academic|professional. */
function encontrarDataGupy(tipo, lado, usados, escopo = "academic") {
  const name = tipo === "year" ? "yearValue" : "monthValue";
  const ladoRe = lado === "end" ? /\bend\b|\bfim\b/i : /\bstart\b|\bin[ií]cio\b/i;
  const escopoRe =
    escopo === "professional"
      ? /professional|profissional|company|empresa|job title|cargo|role/i
      : /academic|education|forma[cç][aã]o|institution|course|escolaridade|qualification/i;

  const candidatos = [...document.querySelectorAll(`input[name="${name}"]`)].filter(
    (el) => !usados.has(el) && campoPreenchivel(el, true),
  );

  const comEscopo = [];
  const soLado = [];

  for (const el of candidatos) {
    let n = el;
    let blob = "";
    for (let i = 0; i < 10 && n; i++) {
      blob += ` ${n.innerText || ""} ${n.getAttribute("aria-label") || ""}`;
      n = n.parentElement;
    }
    const temLado = ladoRe.test(blob);
    const temEscopo = escopoRe.test(blob);
    if (temLado && temEscopo) return el;
    if (temLado) soLado.push(el);
    if (temEscopo) comEscopo.push(el);
  }

  if (soLado.length) {
    // vários Start: 1º academic, 2º professional (ordem DOM)
    if (escopo === "professional") return soLado[1] || soLado[0] || null;
    return soLado[0] || null;
  }

  if (escopo === "professional") return candidatos[1] || null;
  return candidatos[0] || null;
}

async function expandirSecoesGupy() {
  if (!/gupy\.io/i.test(location.hostname)) return;

  const re =
    /experience|experiência|experiencia|academic|about you|sobre você|sobre voce|diversity|diversidade|skills|habilidades|personal|dados|education|curriculum|formação|formacao|professional|profissional|language|idioma/i;

  const candidatos = [
    ...document.querySelectorAll(
      'button[aria-expanded="false"], [role="button"][aria-expanded="false"], div[aria-expanded="false"]',
    ),
  ];

  for (const b of candidatos) {
    const t = `${b.innerText || ""} ${b.getAttribute("aria-label") || ""}`;
    if (!re.test(t.split("\n")[0] || t)) continue;
    try {
      b.click();
      await sleep(150);
    } catch {
      /* ignore */
    }
  }

  // força abrir About you (endereço/gênero)
  const about = [...document.querySelectorAll("button, [role='button'], div[aria-expanded]")].find(
    (el) => /^about you$/i.test((el.innerText || "").trim().split("\n")[0]),
  );
  if (about && about.getAttribute("aria-expanded") === "false") {
    try {
      about.click();
      await sleep(200);
    } catch {
      /* ignore */
    }
  }
}

function textoBotao(b) {
  return normalize(`${b.innerText || ""} ${b.getAttribute("aria-label") || ""} ${b.title || ""}`);
}

function acharBotaoAdd(padroes) {
  const bots = [...document.querySelectorAll("button, a[role='button'], [role='button']")];
  return bots.find((b) => {
    const t = textoBotao(b);
    if (!t || /remove|delete|excluir|salvar|save|cancel|fechar|close/.test(t)) return false;
    return padroes.some((p) => t.includes(normalize(p)));
  });
}

/**
 * Se a formação foi apagada, a Gupy não mostra inputs — precisa clicar em Add.
 */
async function abrirFormulariosGupy(mapa) {
  if (!/gupy\.io/i.test(location.hostname)) return;

  const precisaFormacao = (mapa?.campos ?? []).some(
    (c) =>
      String(c.id || "").startsWith("gupy_education") ||
      String(c.id || "").startsWith("gupy_formation") ||
      String(c.id || "").startsWith("gupy_institution") ||
      String(c.id || "").startsWith("gupy_course") ||
      (c.matchIds || []).some((id) => /education|formation|institution|course/i.test(id)),
  );

  if (!precisaFormacao) return;

  const temCampoFormacao = () =>
    Boolean(
      document.querySelector(
        '[id^="education-level"], [id^="formation"], [id*="institution-autocomplete"], [id^="course"]',
      ),
    );

  if (temCampoFormacao()) return;

  const add = acharBotaoAdd([
    "add another academic experience",
    "add academic experience",
    "add academic",
    "add education",
    "add formation",
    "adicionar experiência acadêmica",
    "adicionar experiencia academica",
    "adicionar formação acadêmica",
    "adicionar formacao academica",
    "adicionar formação",
    "adicionar formacao",
    "academic experience",
    "experiência acadêmica",
    "experiencia academica",
  ]);

  if (!add) return;

  try {
    add.scrollIntoView({ block: "center", behavior: "instant" });
    add.click();
    await sleep(500);

    if (!temCampoFormacao()) {
      const add2 = acharBotaoAdd([
        "add academic",
        "academic",
        "education",
        "formação",
        "formacao",
        "acadêmica",
        "academica",
      ]);
      if (add2 && add2 !== add) {
        add2.click();
        await sleep(550);
      }
    }

    // espera os inputs aparecerem
    const t0 = Date.now();
    while (!temCampoFormacao() && Date.now() - t0 < 2500) {
      await sleep(120);
    }
  } catch {
    /* ignore */
  }
}

function containerDoCampo(el) {
  return (
    el.closest("form") ||
    el.closest("[class*='Card']") ||
    el.closest("[class*='card']") ||
    el.closest("section") ||
    el.closest("li") ||
    el.parentElement?.parentElement ||
    el.parentElement
  );
}

function listarCamposIdiomaNome() {
  return [
    ...document.querySelectorAll(
      'input[id^="languageName"], input[id*="languageName"], input[id*="language-name"], input[role="combobox"]',
    ),
  ].filter((el) => {
    if (!campoPreenchivel(el)) return false;
    const rot = textoRotulo(el);
    const id = normalize(el.id || "");
    return /language|idioma/.test(id) || (/language|idioma/.test(rot) && !/level|nivel/.test(rot));
  });
}

function nivelNoMesmoBloco(nomeEl, usados) {
  const root = containerDoCampo(nomeEl) || document;
  const candidatos = [
    ...root.querySelectorAll(
      'input[id^="languageLevel"], input[id*="languageLevel"], input[id*="language-level"], input[role="combobox"], select',
    ),
  ].filter((el) => {
    if (el === nomeEl || usados.has(el) || !campoPreenchivel(el)) return false;
    const rot = textoRotulo(el);
    const id = normalize(el.id || "");
    return /level|nivel/.test(id) || /level|nivel|profici/.test(rot);
  });
  return candidatos[0] || null;
}

async function garantirLinhasIdioma(qtd) {
  let nomes = listarCamposIdiomaNome();
  let guard = 0;
  while (nomes.length < qtd && guard < 5) {
    const add = acharBotaoAdd([
      "add language",
      "adicionar idioma",
      "add idioma",
      "new language",
    ]);
    if (!add) break;
    add.click();
    await sleep(400);
    nomes = listarCamposIdiomaNome();
    guard += 1;
  }
  return nomes;
}

/**
 * CEP da Gupy autocompleta cidade/rua e trava readOnly — reaplica Tuma depois.
 */
async function preencherEnderecoGupy(campos, usados) {
  const peloId = (id) => campos.find((c) => c.id === id);

  const zip = peloId("gupy_zip");
  const street = peloId("gupy_street");
  const state = peloId("gupy_state");
  const city = peloId("gupy_city");
  const brazil = peloId("gupy_brazil");
  const gender = peloId("gupy_gender");
  const disability = peloId("gupy_disability");
  const linkedin = peloId("gupy_linkedin");
  const cpf = peloId("gupy_cpf");
  const birth = peloId("gupy_birth");

  let n = 0;

  async function aplicar(campo, matchIds, forcar = true) {
    if (!campo?.valor) return false;
    let el = encontrarPorMatchIds(matchIds || campo.matchIds, usados, forcar);
    if (!el && (campo.padroes || []).length) {
      const pads = campo.padroes.map(normalize);
      el = [...document.querySelectorAll("input, textarea, select, [role='combobox']")].find(
        (inp) => {
          if (usados.has(inp)) return false;
          if (!campoPreenchivel(inp, forcar)) return false;
          const rot = textoRotulo(inp);
          return pads.some((p) => rot.includes(p));
        },
      );
    }
    if (!el) return false;
    const ok = forcar
      ? await preencherCampoForcado(el, campo.valor, campo)
      : await preencherCampo(el, campo.valor, campo);
    if (ok) {
      usados.add(el);
      n += 1;
    }
    return ok;
  }

  if (brazil) await aplicar(brazil, ["addressBrazil", "address-brazil"], false);
  if (gender) await aplicar({ ...gender, tipo: "radio" }, ["gender"], false);
  if (disability) await aplicar({ ...disability, tipo: "radio" }, ["hasDisabilities", "has-disabilities"], false);
  if (birth) await aplicar(birth, ["birthDate", "birth-date", "dateOfBirth"], true);

  if (zip) {
    await aplicar(zip, ["addressZipCode", "address-zip", "zipCode"], true);
    await sleep(700); // espera ViaCEP / Gupy preencher e travar campos
  }

  // depois do CEP: força os valores do Tuma por cima do autocomplete
  if (street) await aplicar(street, ["addressStreet", "address-street"], true);
  if (state) await aplicar(state, ["addressState", "address-state"], true);
  if (city) await aplicar(city, ["addressCity", "address-city"], true);

  // segunda passada — CEP às vezes sobrescreve de novo
  await sleep(300);
  if (street) {
    const el = document.getElementById("addressStreet");
    if (el) await preencherCampoForcado(el, street.valor, street);
  }
  if (city) {
    const el = document.getElementById("addressCity");
    if (el) await preencherCampoForcado(el, city.valor, city);
  }
  if (state) {
    const el = document.getElementById("addressState");
    if (el) await preencherCombobox(el, state.valor, state.aliases || []);
  }

  if (linkedin) await aplicar(linkedin, ["linkedinProfileUrl", "linkedin"], true);
  if (cpf) await aplicar(cpf, ["identityCardNumber", "identity-card"], true);

  return n;
}

/**
 * Preenche idioma + nível no mesmo bloco (evita Fluent no espanhol).
 */
async function preencherIdiomasPares(camposIdioma, usados) {
  const pares = [];
  for (const c of camposIdioma) {
    const m = String(c.id || "").match(/^gupy_language(?:_level)?_(\d+)$/);
    if (!m) continue;
    const i = Number(m[1]);
    if (!pares[i]) pares[i] = { i };
    if (String(c.id).includes("level")) pares[i].nivel = c;
    else pares[i].nome = c;
  }

  const lista = pares.filter((p) => p && (p.nome || p.nivel));
  if (!lista.length) return 0;

  await garantirLinhasIdioma(lista.length);
  let nomes = listarCamposIdiomaNome().filter((el) => !usados.has(el));
  let n = 0;

  for (let idx = 0; idx < lista.length; idx++) {
    const par = lista[idx];
    const nomeValor = String(par.nome?.valor || "").trim();
    const nivelValor = String(par.nivel?.valor || "").trim();
    if (!nomeValor && !nivelValor) continue;

    let nomeEl = nomes[idx];
    if (!nomeEl) {
      nomes = listarCamposIdiomaNome().filter((el) => !usados.has(el));
      nomeEl = nomes[0];
    }
    if (!nomeEl) break;

    if (nomeValor) {
      const okNome = await preencherCombobox(
        nomeEl,
        nomeValor,
        par.nome?.aliases || [],
      );
      if (okNome) {
        usados.add(nomeEl);
        n += 1;
      }
    }

    const nivelEl = nivelNoMesmoBloco(nomeEl, usados);
    if (nivelEl && nivelValor) {
      const okNivel = await preencherCombobox(
        nivelEl,
        nivelValor,
        par.nivel?.aliases || [],
      );
      if (okNivel) {
        usados.add(nivelEl);
        n += 1;
      }
    }

    nomes = listarCamposIdiomaNome().filter((el) => !usados.has(el));
    await sleep(100);
  }

  return n;
}

async function preencherListaSkills(campo, usados) {
  const lista = Array.isArray(campo.valores)
    ? campo.valores.map((x) => String(x).trim()).filter(Boolean)
    : String(campo.valor || "")
        .split(/[;,]/)
        .map((x) => x.trim())
        .filter(Boolean);

  if (!lista.length) return 0;

  let n = 0;
  for (const skill of lista.slice(0, 10)) {
    const el =
      encontrarPorMatchIds(campo.matchIds || ["skills-search-autocomplete", "skill"], usados) ||
      [...document.querySelectorAll("input")].find((inp) => {
        if (usados.has(inp) || !campoPreenchivel(inp)) return false;
        return /skill|habilidade|write and select/.test(textoRotulo(inp));
      });

    if (!el) break;

    const ok = await preencherCombobox(el, skill);
    if (ok) {
      n += 1;
      const addBtn = [...document.querySelectorAll("button")].find((b) =>
        /^(add|adicionar|adicionar habilidade)$/i.test(String(b.innerText || "").trim()),
      );
      if (addBtn) {
        addBtn.click();
        await sleep(150);
      }
    }
  }
  return n;
}

/**
 * @param {{ campos: object[], sobrescrever?: boolean }} mapa
 * @returns {Promise<{ preenchidos: number, tentados: number, ids: string[] }>}
 */
async function preencherFormularioComMapa(mapa) {
  await expandirSecoesGupy();
  await abrirFormulariosGupy(mapa);

  const todos = [...(mapa?.campos ?? [])];
  const forcar = mapa?.sobrescrever !== false;

  const IDS_ENDERECO = new Set([
    "gupy_zip",
    "gupy_street",
    "gupy_state",
    "gupy_city",
    "gupy_brazil",
    "gupy_gender",
    "gupy_disability",
    "gupy_linkedin",
    "gupy_cpf",
    "gupy_birth",
  ]);

  const camposIdioma = todos.filter((c) =>
    /^gupy_language(?:_level)?_\d+$/.test(String(c.id || "")),
  );
  const campos = todos
    .filter((c) => !/^gupy_language(?:_level)?_\d+$/.test(String(c.id || "")))
    .filter((c) => !IDS_ENDERECO.has(String(c.id || "")))
    .sort((a, b) => Number(b.prioridade || 0) - Number(a.prioridade || 0));

  const els = [
    ...document.querySelectorAll(
      "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=file]), textarea, select, [role='combobox']",
    ),
  ].filter((el) => campoPreenchivel(el, forcar));

  const usados = new Set();
  const ids = [];
  let preenchidos = 0;

  const nEndereco = await preencherEnderecoGupy(todos, usados);
  if (nEndereco > 0) {
    preenchidos += nEndereco;
    ids.push("endereco");
  }

  const nIdiomas = await preencherIdiomaParesSafe(camposIdioma, usados);
  if (nIdiomas > 0) {
    preenchidos += nIdiomas;
    ids.push("idiomas");
  }

  for (const campo of campos) {
    const pads = (campo.padroes ?? []).map(normalize).filter(Boolean);
    const temValor =
      String(campo.valor ?? "").trim() ||
      (Array.isArray(campo.valores) && campo.valores.length);
    if (!temValor) continue;
    if (!pads.length && !(campo.matchIds && campo.matchIds.length)) continue;

    if (campo.tipo === "skills" || campo.id === "gupy_skill") {
      const n = await preencherListaSkills(campo, usados);
      if (n > 0) {
        preenchidos += n;
        ids.push(campo.id || "skills");
      }
      continue;
    }

    let melhor = null;

    if (campo.id === "gupy_start_mes") melhor = encontrarDataGupy("month", "start", usados, "academic");
    else if (campo.id === "gupy_start_ano") melhor = encontrarDataGupy("year", "start", usados, "academic");
    else if (campo.id === "gupy_end_mes") melhor = encontrarDataGupy("month", "end", usados, "academic");
    else if (campo.id === "gupy_end_ano") melhor = encontrarDataGupy("year", "end", usados, "academic");
    else if (campo.id === "gupy_exp_start_mes") melhor = encontrarDataGupy("month", "start", usados, "professional");
    else if (campo.id === "gupy_exp_start_ano") melhor = encontrarDataGupy("year", "start", usados, "professional");
    else if (campo.id === "gupy_exp_end_mes") melhor = encontrarDataGupy("month", "end", usados, "professional");
    else if (campo.id === "gupy_exp_end_ano") melhor = encontrarDataGupy("year", "end", usados, "professional");
    else melhor = encontrarPorMatchIds(campo.matchIds, usados, forcar);

    if (!melhor && pads.length) {
      let melhorScore = 0;
      for (const el of els) {
        if (usados.has(el)) continue;
        const rotulo = textoRotulo(el);
        if (!rotulo) continue;

        let score = 0;
        for (const p of pads) {
          if (rotulo.includes(p)) score = Math.max(score, p.length);
        }
        if (
          campo.id &&
          el.id &&
          normalize(el.id).includes(normalize(campo.id).replace(/^gupy_/, ""))
        ) {
          score += 8;
        }
        if (score > melhorScore) {
          melhorScore = score;
          melhor = el;
        }
      }
      if (melhorScore <= 0) melhor = null;
    }

    if (melhor) {
      const ok = forcar
        ? await preencherCampoForcado(melhor, campo.valor, campo)
        : await preencherCampo(melhor, campo.valor, campo);
      if (ok) {
        usados.add(melhor);
        preenchidos += 1;
        ids.push(campo.id || pads[0] || melhor.id);
        await sleep(70);
      }
    }
  }

  return { preenchidos, tentados: todos.length, ids };
}

async function preencherIdiomaParesSafe(camposIdioma, usados) {
  try {
    return await preencherIdiomasPares(camposIdioma, usados);
  } catch {
    return 0;
  }
}
