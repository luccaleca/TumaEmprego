import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/prisma";

export async function GET() {
  const base = {
    ok: true,
    service: "tuma-emprego",
    port: 3737,
  };

  try {
    await checkDatabaseConnection();
    return NextResponse.json({
      ...base,
      database: "connected",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ...base,
        ok: false,
        database: "disconnected",
        error: err.message,
      },
      { status: 503 },
    );
  }
}
