import { NextResponse } from "next/server";
import { getPrisma } from "@/app/lib/db";

export async function GET() {
  let postgres = false;

  try {
    await getPrisma().$queryRaw`SELECT 1`;
    postgres = true;
  } catch {
    postgres = false;
  }

  const cloudinary = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );

  const enquiryEmail = Boolean(
    (process.env.TRAVEL_BEATS_ADMIN_EMAIL || process.env.ADMIN_EMAIL) &&
    process.env.RESEND_API_KEY &&
    process.env.RESEND_FROM_EMAIL,
  );

  return NextResponse.json({
    ok: postgres && cloudinary,
    services: {
      postgres,
      cloudinary,
      enquiryEmail,
    },
  });
}
