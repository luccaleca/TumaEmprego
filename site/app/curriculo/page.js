import CurriculoWorkspace from "@/components/curriculo/CurriculoWorkspace";
import { parseCvBase, parseCvDocument, sectionsForDisplay, cleanPreambleForExport } from "@/lib/cv";
import { getBusca, getCvBase } from "@/lib/dados";
import { sincronizarSlotsSegmento } from "@/lib/adaptarCvBusca";
import { getVagaCatalogo } from "@/lib/vagaCatalogo";
import {
  getSegmentacaoConteudo,
  listSegmentacoesVisiveis,
  migrarAdaptadoBuscaLegado,
  migrarSegmentacoesParaSlots,
} from "@/lib/segmentacoes";

export const metadata = {
  title: "Tuma Emprego — Currículo",
};

export default async function CurriculoPage() {
  migrarAdaptadoBuscaLegado();
  migrarSegmentacoesParaSlots();

  const busca = getBusca();
  const catalogo = await getVagaCatalogo();

  try {
    await sincronizarSlotsSegmento(busca, catalogo);
  } catch {
    /* cv-base vazio ou erro de leitura — slots aparecem quando houver base */
  }

  const segmentacoes = listSegmentacoesVisiveis(busca.segmentos_ativos ?? []).map((seg) => {
    if (!seg.hasMd) return seg;
    const conteudo = getSegmentacaoConteudo(seg.id);
    const sections =
      conteudo?.formato === "markdown" ? parseCvBase(conteudo.content) : [];
    return { ...seg, _sections: sections };
  });

  const baseDoc = parseCvDocument(getCvBase());
  const estruturaBase = {
    preamble: cleanPreambleForExport(baseDoc.preamble),
    sections: sectionsForDisplay(baseDoc.sections),
    content: getCvBase(),
  };

  return (
    <CurriculoWorkspace
      initialSegmentacoes={segmentacoes}
      estruturaBase={estruturaBase}
    />
  );
}
