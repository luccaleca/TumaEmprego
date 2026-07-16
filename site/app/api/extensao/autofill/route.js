import { NextResponse } from "next/server";
import { montarAutofillCandidato } from "@/lib/autofillCandidato.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const segmento_slug = searchParams.get("segmento_slug") || "";
    const portal = searchParams.get("portal") || "";
    const data = montarAutofillCandidato({ segmento_slug, portal });
    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Falha ao montar autofill", detail: err.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const data = montarAutofillCandidato({
      segmento_slug: body.segmento_slug || "",
      portal: body.portal || "",
      vaga_titulo: body.vaga_titulo || "",
      vaga_descricao: body.vaga_descricao || "",
      descricao_para_vaga: body.descricao_para_vaga || "",
    });
    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Falha ao montar autofill", detail: err.message },
      { status: 500 },
    );
  }
}
