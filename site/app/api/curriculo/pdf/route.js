import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "O currículo base não gera PDF — use as variações por segmento ou adapte em Vaga.",
    },
    { status: 400 },
  );
}

export async function GET() {
  return NextResponse.json({ temPdf: false, desatualizado: false, pdfUrl: null });
}
