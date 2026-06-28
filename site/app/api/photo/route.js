import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getProfilePhotoPath } from "@/lib/dados";

const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET() {
  const photoPath = getProfilePhotoPath();
  if (!photoPath) {
    return new NextResponse(null, { status: 404 });
  }

  const ext = path.extname(photoPath).toLowerCase();
  const buffer = fs.readFileSync(photoPath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
