import { NextResponse } from "next/server";
import {
  listarPortaisComStatus,
  metaPortalParaResposta,
  resolverPortalVagaInput,
} from "@/lib/portaisCatalogo";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vaga_url = String(searchParams.get("url") ?? "").trim();

    if (vaga_url) {
      const portal = resolverPortalVagaInput({ vaga_url });
      return NextResponse.json({
        vaga_url,
        ...metaPortalParaResposta(portal),
      });
    }

    return NextResponse.json({ portais: listarPortaisComStatus() });
  } catch (err) {    return NextResponse.json(
      { error: "Não foi possível listar portais", detail: err.message },
      { status: 500 },
    );
  }
}
