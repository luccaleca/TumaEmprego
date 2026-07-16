import { Suspense } from "react";
import CurriculoWorkspace from "@/components/curriculo/CurriculoWorkspace";
import { parseCvBase, parseCvDocument, sectionsForDisplay, cleanPreambleForExport } from "@/lib/cv";
import { montarColunasCurriculo } from "@/lib/curriculoColunas";
import { getBusca, getCvBase } from "@/lib/dados";
import { sincronizarSlotsSegmento } from "@/lib/adaptarCvBusca";
import { listarPortaisComStatus } from "@/lib/portaisCatalogo";
import { montarValoresTodosPortaisEstrutura } from "@/lib/portaisValores";
import { getVagaCatalogo } from "@/lib/vagaCatalogo";
import {
  getSegmentacaoConteudo,
  listSegmentacoes,
  migrarAdaptadoBuscaLegado,
  migrarSegmentacoesParaSlots,
} from "@/lib/segmentacoes";

export const metadata = {
  title: "Tuma Emprego — Currículo",
};

function enrichSegmentacao(seg) {
  if (!seg.hasMd) return seg;
  const conteudo = getSegmentacaoConteudo(seg.id);
  const sections = conteudo?.formato === "markdown" ? parseCvBase(conteudo.content) : [];
  return { ...seg, _sections: sections };
}

export default async function CurriculoPage() {
  migrarAdaptadoBuscaLegado();
  migrarSegmentacoesParaSlots();

  const busca = getBusca();
  const catalogo = await getVagaCatalogo();

  try {
    await sincronizarSlotsSegmento(busca, catalogo);
  } catch {
    /* cv-base vazio */
  }

  const segmentacoes = listSegmentacoes().map(enrichSegmentacao);
  const colunas = montarColunasCurriculo(segmentacoes, busca.segmentos_ativos ?? []);
  const portais = listarPortaisComStatus();
  const valoresPortais = montarValoresTodosPortaisEstrutura();

  const baseDoc = parseCvDocument(getCvBase());
  const estruturaBase = {
    preamble: cleanPreambleForExport(baseDoc.preamble),
    sections: sectionsForDisplay(baseDoc.sections),
    content: getCvBase(),
  };

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center text-sm text-zinc-500">
          Carregando…
        </div>
      }
    >
      <CurriculoWorkspace
        initialColunas={colunas}
        initialPortais={portais}
        valoresPortais={valoresPortais}
        estruturaBase={estruturaBase}
      />
    </Suspense>
  );
}
