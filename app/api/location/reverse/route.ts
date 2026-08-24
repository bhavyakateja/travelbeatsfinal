import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const latitude = Number(request.nextUrl.searchParams.get("latitude"));
  const longitude = Number(request.nextUrl.searchParams.get("longitude"));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return NextResponse.json({ message: "Invalid location coordinates." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}`,
      {
        headers: { "User-Agent": "TravelBeats/1.0 (profile location lookup)" },
        cache: "no-store",
      },
    );

    if (!response.ok) throw new Error("Reverse geocoding failed");
    const result = await response.json() as { address?: Record<string, string | undefined> };
    const address = result.address ?? {};

    return NextResponse.json({
      city: address.city || address.town || address.village || address.municipality || address.county || "",
      state: address.state || address.region || address.state_district || "",
      pincode: address.postcode || "",
    });
  } catch {
    return NextResponse.json({ message: "We could not identify the address for this location." }, { status: 502 });
  }
}
