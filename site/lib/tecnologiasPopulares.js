/** Slugs mais usados no mercado — por vertente (ordem de destaque). */
export const SLUGS_POPULARES_POR_VERTENTE = {
  dados: [
    "sql",
    "python",
    "excel",
    "power-bi",
    "postgresql",
    "bigquery",
    "pandas",
    "ga4",
    "dbt",
    "apache-airflow",
    "tableau",
    "snowflake",
  ],
  desenvolvimento: [
    "javascript",
    "typescript",
    "react",
    "nextjs",
    "nodejs",
    "python-dev",
    "git",
    "docker",
    "postgresql",
    "aws",
    "html",
    "css",
    "tailwind",
    "fastapi",
  ],
  performance: [
    "google-ads",
    "meta-ads",
    "ga4",
    "gtm",
    "seo",
    "google-search-console",
    "hubspot",
    "ab-testing",
    "looker-studio",
    "linkedin-ads",
    "hotjar",
  ],
  ia: [
    "openai-api",
    "langchain",
    "rag",
    "prompt-engineering",
    "scikit-learn",
    "pytorch",
    "jupyter",
    "hugging-face",
    "claude-api",
    "llamaindex",
    "tensorflow",
    "numpy",
  ],
  automacao: [
    "n8n",
    "zapier",
    "make",
    "playwright",
    "github-actions",
    "selenium",
    "power-automate",
    "webhooks",
    "python-scripting",
    "aws-lambda",
  ],
};

export function isTecnologiaPopular(vertenteSlug, itemSlug) {
  const lista = SLUGS_POPULARES_POR_VERTENTE[vertenteSlug] ?? [];
  return lista.includes(itemSlug);
}

export function filtrarItensPorModo(itens, vertenteSlug, modo) {
  if (modo === "todas") return itens ?? [];
  const populares = new Set(SLUGS_POPULARES_POR_VERTENTE[vertenteSlug] ?? []);
  const filtrados = (itens ?? []).filter((i) => populares.has(i.slug));
  return filtrados.length ? filtrados : (itens ?? []).slice(0, 12);
}
