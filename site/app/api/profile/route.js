import { NextResponse } from "next/server";
import { getProfile } from "@/lib/dados";

export async function GET() {
  try {
    const profile = getProfile();
    return NextResponse.json(profile);
  } catch (err) {
    return NextResponse.json(
      { error: "Não foi possível ler dados/config/profile.yml", detail: err.message },
      { status: 500 },
    );
  }
}
