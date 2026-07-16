import { executarPacoteCvVaga } from "./adaptarCvVaga.js";
import { executarPacoteSolidesVaga } from "./adaptarSolides.js";
import { upsertCandidaturaDePacote } from "./candidaturas.js";
import {
  metaPortalParaResposta,
  portalTemMotorAtivo,
  resolverPortalVagaInput,
} from "./portaisCatalogo.js";

/**
 * Decide se o pacote deve usar motor de portal estruturado (Sólides).
 * Gupy não gera pacote CV — só estrutura + autofill.
 */
export function deveGerarPacotePortal(input) {
  const formato = String(input?.formato ?? "auto").toLowerCase();
  if (formato === "ats") return false;
  if (formato === "solides") return true;
  if (formato === "gupy") return false;

  const portal = resolverPortalVagaInput(input);
  return portal === "solides" && portalTemMotorAtivo(portal);
}

function anexarCandidatura(resultado, input) {
  if (resultado?.status !== "concluido") return resultado;
  try {
    const candidatura = upsertCandidaturaDePacote(resultado, {
      origem: input?.origem_candidatura ?? (input?.via_extensao ? "extensao" : "site-vaga"),
    });
    return candidatura ? { ...resultado, candidatura } : resultado;
  } catch {
    return resultado;
  }
}

/**
 * Gera pacote para vaga: portal estruturado (Sólides) ou ATS, conforme URL/formato.
 */
export async function executarPacoteVaga(input, { gerarPdf = true } = {}) {
  const vaga_url = String(input?.vaga_url ?? "").trim();
  const portal = resolverPortalVagaInput(input);
  const portalMeta = metaPortalParaResposta(portal);

  // Gupy: sem CV automático — só se o usuário pedir formato ats (Fazer currículo)
  const formato = String(input?.formato ?? "auto").toLowerCase();
  if (formato !== "ats" && (portal === "gupy" || formato === "gupy")) {
    let descricao_para_vaga = null;
    try {
      const { buildDescricaoParaVaga } = await import("./descricaoVaga.js");
      descricao_para_vaga = buildDescricaoParaVaga({
        vaga_titulo: input?.vaga_titulo,
        vaga_descricao: input?.vaga_descricao,
        segmento_slug: input?.segmento_slug,
      });
    } catch {
      descricao_para_vaga = null;
    }
    return {
      status: "concluido",
      ...portalMeta,
      formato_gerado: null,
      so_estrutura: true,
      segmento_slug: input?.segmento_slug ?? null,
      descricao_para_vaga,
      pedido: {
        vaga_titulo: input?.vaga_titulo ?? "",
        vaga_url,
      },
    };
  }

  const usarPortal = deveGerarPacotePortal({ ...input, vaga_url, portal });

  if (usarPortal && portal === "solides") {
    const resultado = await executarPacoteSolidesVaga({
      ...input,
      vaga_url,
      portal: "solides",
    });

    if (resultado.status !== "concluido") {
      return { ...resultado, ...portalMeta, formato_gerado: null };
    }

    return anexarCandidatura(
      {
        ...resultado,
        ...portalMeta,
        formato_gerado: "solides",
        motor: "solides",
      },
      input,
    );
  }

  const resultado = await executarPacoteCvVaga(
    { ...input, vaga_url, portal: portal ?? undefined },
    { gerarPdf },
  );

  return anexarCandidatura(
    {
      ...resultado,
      ...portalMeta,
      formato_gerado: resultado.status === "concluido" ? "ats" : null,
    },
    input,
  );
}
