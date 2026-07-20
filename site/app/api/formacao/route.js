import { NextResponse } from "next/server";
import { getFormacao, saveFormacao } from "@/lib/dados";

export async function GET() {
  try {
    return NextResponse.json({ formacao: getFormacao() });
  } catch (err) {
    return NextResponse.json(
      { error: "Não leu a formação", detail: err.message },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const { formacao } = await request.json();
    if (!formacao) {
      return NextResponse.json({ error: "Campo formacao obrigatório" }, { status: 400 });
    }
    saveFormacao(formacao);
    return NextResponse.json({ ok: true, formacao: getFormacao() });
  } catch (err) {
    return NextResponse.json(
      { error: "Não salvou", detail: err.message },
      { status: 500 },
    );
  }
}
