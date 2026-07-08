function limparTexto(texto) {
  return String(texto ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function lerJsonLdJobPosting() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      const lista = Array.isArray(data) ? data : [data];

      for (const item of lista) {
        const job = normalizarJobLd(item);
        if (job) return job;
        if (item["@graph"]) {
          for (const node of item["@graph"]) {
            const nested = normalizarJobLd(node);
            if (nested) return nested;
          }
        }
      }
    } catch {
      /* ignora JSON inválido */
    }
  }
  return null;
}

function normalizarJobLd(item) {
  if (!item || typeof item !== "object") return null;
  const tipo = item["@type"];
  const tipos = Array.isArray(tipo) ? tipo : [tipo];
  if (!tipos.some((t) => String(t).toLowerCase().includes("jobposting"))) return null;

  const titulo = item.title ?? item.name ?? "";
  const descricao = item.description ?? "";
  if (limparTexto(descricao).length < 20) return null;

  return {
    titulo: limparTexto(titulo),
    descricao: limparTexto(descricao),
    fonte: "json-ld",
  };
}

function textoDeSeletores(seletores) {
  for (const sel of seletores) {
    const el = document.querySelector(sel);
    const txt = limparTexto(el?.innerText ?? el?.textContent ?? "");
    if (txt.length >= 20) return txt;
  }
  return "";
}

function tituloDeSeletores(seletores) {
  for (const sel of seletores) {
    const el = document.querySelector(sel);
    const txt = limparTexto(el?.innerText ?? el?.textContent ?? "");
    if (txt.length >= 3 && txt.length <= 160) return txt;
  }
  return "";
}

function extrairLinkedIn() {
  const host = location.hostname.replace(/^www\./, "");
  if (!host.includes("linkedin.com")) return null;

  const titulo =
    tituloDeSeletores([
      ".job-details-jobs-unified-top-card__job-title h1",
      ".jobs-unified-top-card__job-title h1",
      "h1.t-24",
      "h1",
    ]) || document.title.replace(/\s*\|\s*LinkedIn.*$/i, "").trim();

  const descricao = textoDeSeletores([
    "#job-details",
    ".jobs-description__content",
    ".jobs-description-content__text",
    "[data-test-id=\"job-details-page\"] .jobs-box",
    "article",
  ]);

  if (descricao.length < 20) return null;
  return { titulo, descricao, fonte: "linkedin" };
}

function extrairGupy() {
  const host = location.hostname.replace(/^www\./, "");
  if (!host.includes("gupy.io") && !host.includes("gupy.com.br")) return null;

  const titulo = tituloDeSeletores([
    "h1[data-testid=\"job-title\"]",
    "h1.job-header__title",
    "h1",
  ]);

  const descricao = textoDeSeletores([
    "[data-testid=\"job-description\"]",
    ".job-description",
    ".job-description__content",
    "section",
    "main",
  ]);

  if (descricao.length < 20) return null;
  return { titulo, descricao, fonte: "gupy" };
}

function extrairGenerico() {
  const titulo =
    tituloDeSeletores(["h1", "[role=\"heading\"]", "header h2"]) ||
    document.title.split("|")[0].split("-")[0].trim();

  const descricao = textoDeSeletores([
    "main",
    "[role=\"main\"]",
    "article",
    "#content",
    ".job-description",
    ".description",
  ]);

  if (descricao.length < 80) return null;
  return { titulo, descricao, fonte: "generico" };
}

function extrairVagaDaPagina() {
  const jsonLd = lerJsonLdJobPosting();
  if (jsonLd) return { ...jsonLd, url: location.href };

  const linkedin = extrairLinkedIn();
  if (linkedin) return { ...linkedin, url: location.href };

  const gupy = extrairGupy();
  if (gupy) return { ...gupy, url: location.href };

  const generico = extrairGenerico();
  if (generico) return { ...generico, url: location.href };

  return {
    titulo: document.title.trim(),
    descricao: "",
    url: location.href,
    fonte: "none",
  };
}
