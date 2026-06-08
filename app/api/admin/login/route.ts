import { ADMIN_COOKIE, getAdminTokenEnv, verifyAdminToken } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const expected = getAdminTokenEnv();
  if (!expected) {
    return NextResponse.json({ ok: true, message: "未启用 ADMIN_TOKEN，无需登录" });
  }

  const body = await request.json();
  const token = String(body.token ?? "").trim();

  if (!verifyAdminToken(token)) {
    return NextResponse.json({ ok: false, error: "密码错误" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
