import { NextResponse } from "next/server";
import { getPortalCampos, savePortalCampos } from "@/lib/dados";
import {
  montarValoresEstruturaGupy,
  montarValoresEstruturaPortal,
  montarValoresEstruturaSolides,
} from "@/lib/portaisValores";

const PORTAIS = new Set(["solides", "gupy"]);

function valoresBase(id) {
  if (id === "solides") return montarValoresEstruturaSolides();
  if (id === "gupy") return montarValoresEstruturaGupy();
  return {};
}

export async function GET(_request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = String(rawId ?? "").toLowerCase();
    if (!PORTAIS.has(id)) {
      return NextResponse.json({ error: "Portal inválido" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      portal: id,
      campos: getPortalCampos(id),
      valores: montarValoresEstruturaPortal(id),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Falha ao ler campos do portal", detail: err.message },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = String(rawId ?? "").toLowerCase();
    if (!PORTAIS.has(id)) {
      return NextResponse.json({ error: "Portal inválido" }, { status: 404 });
    }

    const body = await request.json();
    const campos = body?.campos;
    if (!campos || typeof campos !== "object" || Array.isArray(campos)) {
      return NextResponse.json({ error: "Campo campos obrigatório" }, { status: 400 });
    }

    savePortalCampos(id, campos, valoresBase(id));
    return NextResponse.json({
      ok: true,
      portal: id,
      campos: getPortalCampos(id),
      valores: montarValoresEstruturaPortal(id),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Falha ao salvar", detail: err.message },
      { status: 500 },
    );
  }
}
