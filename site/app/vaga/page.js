import VagaWorkspace from "@/components/vaga/VagaWorkspace";
import { parseCvBase } from "@/lib/cv";
import { getSegmentacaoConteudo, listSegmentacoesVaga } from "@/lib/segmentacoes";

export const metadata = {
  title: "Tuma Emprego — Vaga",
};

export default function VagaPage() {
  const adaptacoes = listSegmentacoesVaga().map((seg) => {
    if (!seg.hasMd) return seg;
    const conteudo = getSegmentacaoConteudo(seg.id);
    const sections =
      conteudo?.formato === "markdown" ? parseCvBase(conteudo.content) : [];
    return { ...seg, _sections: sections };
  });

  return <VagaWorkspace initialAdaptacoes={adaptacoes} />;
}
