import { NextResponse } from "next/server";
import { getVagaCatalogo } from "@/lib/vagaCatalogo";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [catalogo, senioridades] = await Promise.all([
      getVagaCatalogo(),
      prisma.vagaSenioridade.findMany({ orderBy: { ordem: "asc" } }),
    ]);

    return NextResponse.json({
      catalogo,
      senioridades: senioridades.map((s) => ({
        slug: s.slug,
        nome: s.nome,
        sinonimos: s.sinonimos,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível carregar o catálogo de vagas", detail: err.message },
      { status: 500 },
    );
  }
}
