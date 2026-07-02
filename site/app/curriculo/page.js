import CurriculoWorkspace from "@/components/curriculo/CurriculoWorkspace";
import { parseCvBase } from "@/lib/cv";
import { getCurriculoArquivo } from "@/lib/dados";
import {
  getSegmentacaoConteudo,
  listSegmentacoes,
  migrarAdaptadoBuscaLegado,
} from "@/lib/segmentacoes";

export const metadata = {
  title: "Tuma Emprego — Currículo",
};

export default function CurriculoPage() {
  migrarAdaptadoBuscaLegado();
  const arquivo = getCurriculoArquivo();

  const segmentacoes = listSegmentacoes().map((seg) => {
    if (!seg.hasMd) return seg;
    const conteudo = getSegmentacaoConteudo(seg.id);
    const sections =
      conteudo?.formato === "markdown" ? parseCvBase(conteudo.content) : [];
    return { ...seg, _sections: sections };
  });

  return (
    <CurriculoWorkspace initialArquivo={arquivo} initialSegmentacoes={segmentacoes} />
  );
}
