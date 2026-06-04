import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  console.info("[Lead]", body);
  return NextResponse.json({
    ok: true,
    message: "Thank you! We will contact you soon.",
  });
}
