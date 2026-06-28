import { NextResponse } from "next/server";
import { getProfile, saveProfile } from "@/lib/dados";

export async function GET() {
  try {
    return NextResponse.json({ profile: getProfile() });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível ler dados/config/profile.yml", detail: err.message },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const { profile } = await request.json();
    if (!profile) {
      return NextResponse.json({ error: "Campo profile obrigatório" }, { status: 400 });
    }
    saveProfile(profile);
    return NextResponse.json({ ok: true, profile: getProfile() });
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível salvar", detail: err.message },
      { status: 500 },
    );
  }
}
