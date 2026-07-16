import { NextResponse } from "next/server";
import { getMoldeSolidesVagasJson } from "@/lib/solidesVagasMolde";

export async function GET() {
  return NextResponse.json({
    molde: getMoldeSolidesVagasJson(),
  });
}
