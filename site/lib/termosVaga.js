/**
 * Extrai termos úteis da JD para reordenar ênfase do CV (sem inventar fatos).
 */

const STOP = new Set(
  [
    "para", "com", "você", "voce", "como", "mais", "essa", "esse", "esta", "este",
    "pela", "pelo", "dos", "das", "uma", "uno", "nos", "nas", "que", "nao", "não",
    "ser", "ter", "seu", "sua", "seus", "suas", "aqui", "todo", "toda", "todos",
    "nossos", "nossa", "nosso", "sobre", "sobre", "vaga", "etapa", "etapas",
    "beneficio", "beneficios", "benefício", "benefícios", "plano", "saude", "saúde",
    "processo", "programas", "programa", "empresa", "time", "pessoas", "todas",
    "tambem", "também", "desde", "muito", "outras", "outro", "onde", "quando",
    "podem", "pode", "será", "sera", "fazer", "anos", "ano", "dia", "dias",
    "trabalho", "modelo", "remoto", "presencial", "hibrido", "híbrido", "estagio",
    "estágio", "trainee", "inscricoes", "inscrições", "cadastro", "entrevista",
  ].map((w) =>
    w
      .normalize("NFD")
      .replace(/\p{M}/gu, ""),
  ),
);

/** Multi-palavras / techs frequentes em JD BR — peso extra se aparecerem. */
const FRASES_CHAVE = [
  "inteligencia artificial",
  "inteligência artificial",
  "machine learning",
  "prompt engineering",
  "ai first",
  "linguagem natural",
  "agente de ia",
  "agentes de ia",
  "automacao",
  "automação",
  "integracoes",
  "integrações",
  "claude",
  "gemini",
  "chatgpt",
  "openai",
  "langchain",
  "llamaindex",
  "rag",
  "llm",
  "python",
  "fastapi",
  "n8n",
  "make",
  "zapier",
  "postgresql",
  "sql",
  "next.js",
  "nextjs",
  "react",
  "node.js",
  "nodejs",
  "chroma",
  "ollama",
  "pytorch",
  "tensorflow",
  "aws",
  "azure",
  "gcp",
  "hacker mindset",
  "causas raiz",
  "status quo",
  "mentoria invertida",
];

export function normalizeTexto(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * Lista de termos da vaga (frases + tokens), únicos, prontos pra scoreTexto.
 */
export function termosDaVaga(titulo, descricao) {
  const blob = `${titulo ?? ""}\n${descricao ?? ""}`;
  const n = normalizeTexto(blob);
  const out = [];

  for (const frase of FRASES_CHAVE) {
    if (n.includes(normalizeTexto(frase))) out.push(frase);
  }

  const tokens = n
    .split(/[^\p{L}\p{N}+#.]+/u)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && w.length <= 32 && !STOP.has(w));

  for (const t of tokens) out.push(t);

  return [...new Set(out)];
}

/**
 * JD pede prova em produto/automação/agentes de IA (não só “dados / BI”).
 * Nesses casos o motor prioriza projetos tipo TumaCore / TumaIA.
 */
export function jdEnfatizaProjetosIa(titulo, descricao) {
  const n = normalizeTexto(`${titulo ?? ""}\n${descricao ?? ""}`);
  return (
    /\bagente|\bagentes\b|prompt|claude|gemini|make\b|zapier|n8n|llm|\brag\b|ai first|chat sql|generativa|automacao|automação/.test(
      n,
    ) ||
    /inteligencia artificial|inteligência artificial|machine learning/.test(n)
  );
}

/**
 * Cargo-alvo neutro (sem nome de empresa/programa da vaga).
 * Espelha o tipo de trabalho da JD usando só o que o candidato pode alegar.
 */
export function cargoAlvoNeutroDaVaga(perfil, titulo, descricao) {
  const n = normalizeTexto(`${titulo ?? ""}\n${descricao ?? ""}`);
  const base = String(perfil?.cargoAlvo ?? "").trim();

  const querAgentes =
    /\bagente|\bagentes\b|prompt engineering|prompt\b|claude|gemini|chat ?gpt/.test(n);
  const querAutomacao =
    /automacao|automação|\bn8n\b|\bmake\b|\bzapier\b|processo manual/.test(n);
  const querIa =
    /inteligencia artificial|inteligência artificial|ai first|\bia\b|\bllm\b|\brag\b|machine learning|\bml\b/.test(
      n,
    );

  if (querAgentes && querIa) {
    return "Estágio em IA, automação e agentes";
  }
  if (querAgentes) {
    return "Estágio em automação e agentes de IA";
  }
  if (querAutomacao && querIa) {
    return "Estágio em IA e automação";
  }
  if (querIa && perfil?.slug === "ia-ml") {
    return base || "Estágio / Trainee em IA, ML ou Engenharia de IA";
  }
  if (/back-?end|backend|api rest|fastapi|python/.test(n) && perfil?.slug === "desenvolvimento") {
    return "Estágio em desenvolvimento back-end";
  }
  return base || `Estágio em ${perfil?.label ?? "tecnologia"}`;
}

/** Bullet que parece nota interna — nunca vai pro CV. */
export function bulletPareceMetadado(texto) {
  const t = String(texto ?? "");
  return /prova principal|n[aã]o o est[aá]gio|banco\.yml|nota_por_segmento|destaque projetos|metadado|instru[cç][aã]o interna|para o agente|tuma emprego \(rag/i.test(
    t,
  );
}
