import { ADMIN_COOKIE, adminCookieOptions } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", adminCookieOptions(0, request));
  return res;
}
