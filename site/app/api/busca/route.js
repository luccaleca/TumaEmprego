import { NextResponse } from "next/server";
import { adaptarAposSalvarBusca } from "@/lib/adaptarCvBusca";
import { getBusca, saveBusca } from "@/lib/dados";
import { getVagaCatalogo } from "@/lib/vagaCatalogo";
import { OPCOES_MODO, OPCOES_MODALIDADE } from "@/lib/buscaOpcoes";
import { OPCOES_SENIORIDADE } from "@/lib/senioridadeOpcoes";

export async function GET() {
  try {
    return NextResponse.json({ busca: getBusca() });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível ler dados/config/busca.yml", detail: err.message },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const { busca } = await request.json();
    if (!busca) {
      return NextResponse.json({ error: "Campo busca obrigatório" }, { status: 400 });
    }

    if (!Array.isArray(busca.titulos_ativos)) {
      return NextResponse.json(
        { error: "titulos_ativos deve ser uma lista" },
        { status: 400 },
      );
    }

    if (!Array.isArray(busca.segmentos_ativos) || !busca.segmentos_ativos.length) {
      return NextResponse.json(
        { error: "Marque ao menos um segmento para gerar currículo" },
        { status: 400 },
      );
    }

    const senioridades = (busca.senioridades ?? []).filter((s) =>
      OPCOES_SENIORIDADE.includes(s),
    );
    const modalidades = (busca.modalidades_trabalho ?? []).filter((m) =>
      OPCOES_MODALIDADE.includes(m),
    );

    if (!senioridades.length) {
      return NextResponse.json(
        { error: "Selecione ao menos uma senioridade" },
        { status: 400 },
      );
    }

    if (!modalidades.length) {
      return NextResponse.json(
        { error: "Selecione ao menos uma modalidade de trabalho" },
        { status: 400 },
      );
    }

    const modo = OPCOES_MODO.includes(busca.modo_busca) ? busca.modo_busca : "focado";

    saveBusca({
      segmentos_ativos: busca.segmentos_ativos.filter(Boolean),
      titulos_ativos: busca.titulos_ativos.filter(Boolean),
      senioridades,
      modalidades_trabalho: modalidades,
      modo_busca: modo,
      nota_minima: Number(busca.nota_minima) || 4,
    });

    const buscaSalva = getBusca();
    const catalogo = await getVagaCatalogo();
    const adaptacao = await adaptarAposSalvarBusca(buscaSalva, catalogo);

    return NextResponse.json({ ok: true, busca: buscaSalva, adaptacao });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível salvar", detail: err.message },
      { status: 500 },
    );
  }
}
