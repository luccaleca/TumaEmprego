import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "tuma-emprego",
    port: 3737,
  });
}
