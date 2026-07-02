import path from "path";
import {
  extrairMarkdownResposta,
  markdownAdaptadoValido,
} from "./adaptarCvLocal.js";

const REPO_ROOT = path.join(process.cwd(), "..");

export async function tentarAdaptarComCursor(prompt, cvBase) {
  if (!process.env.CURSOR_API_KEY) return null;

  try {
    const { Agent } = await import("@cursor/sdk");
    const instrucao = `${prompt}

IMPORTANTE: Responda APENAS com o markdown completo do currículo adaptado (começando com # ou ## Resumo). Não escreva arquivos, não explique — só o CV.`;

    const result = await Agent.prompt(`${instrucao}\n\n---\n\nCV BASE:\n\n${cvBase}`, {
      apiKey: process.env.CURSOR_API_KEY,
      model: { id: "composer-2.5" },
      local: { cwd: REPO_ROOT },
    });

    if (result?.status === "error") return null;

    const texto = extrairMarkdownResposta(result?.result ?? result?.output ?? "");
    return markdownAdaptadoValido(texto) ? texto : null;
  } catch {
    return null;
  }
}
