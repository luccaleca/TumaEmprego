import {
  atualizarCandidatura,
  criarCandidaturaManual,
  getCandidatura,
  listarCandidaturas,
  removerCandidatura,
  STATUS_CANDIDATURA,
  upsertCandidaturaDePacote,
} from "@/lib/candidaturas";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      candidaturas: listarCandidaturas(),
      status: STATUS_CANDIDATURA,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível listar candidaturas", detail: err.message },
      { status: 500 },
    );
  }
}

/** Criação via pacote de vaga ou card manual (Forms / sem pacote). */
export async function POST(request) {
  try {
    const body = await request.json();
    if (body?.resultado) {
      const candidatura = upsertCandidaturaDePacote(body.resultado, {
        origem: body.origem ?? "manual",
      });
      if (!candidatura) {
        return NextResponse.json({ error: "Pacote inválido" }, { status: 400 });
      }
      return NextResponse.json({ ok: true, candidatura });
    }

    if (body?.vaga_titulo) {
      const candidatura = criarCandidaturaManual(body);
      return NextResponse.json({ ok: true, candidatura });
    }

    return NextResponse.json(
      { error: "Envie resultado do pacote ou vaga_titulo" },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível criar candidatura", detail: err.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const id = String(body?.id ?? "").trim();
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

    if (!getCandidatura(id)) {
      return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    }

    const candidatura = atualizarCandidatura(id, {
      status: body.status,
      notas: body.notas,
    });
    return NextResponse.json({ ok: true, candidatura });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível atualizar", detail: err.message },
      { status: 400 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = String(searchParams.get("id") ?? "").trim();
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

    if (!removerCandidatura(id)) {
      return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível remover", detail: err.message },
      { status: 500 },
    );
  }
}
