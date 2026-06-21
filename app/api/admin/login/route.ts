import { ADMIN_COOKIE, adminCookieOptions, getAdminTokenEnv, verifyAdminToken } from "@/lib/admin-auth";
import { checkRateLimit } from "@/lib/admin-rate-limit";
import { NextRequest, NextResponse } from "next/server";

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 8;

export async function POST(request: NextRequest) {
  const expected = getAdminTokenEnv();
  if (!expected) {
    return NextResponse.json({ ok: true, message: "未启用 ADMIN_TOKEN，无需登录" });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(`admin-login:${ip}`, MAX_ATTEMPTS, WINDOW_MS)) {
    return NextResponse.json(
      { ok: false, error: "登录尝试过于频繁，请 1 分钟后再试" },
      { status: 429 }
    );
  }

  const body = await request.json();
  const token = String(body.token ?? "").trim();

  if (!verifyAdminToken(token)) {
    return NextResponse.json({ ok: false, error: "密码错误" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
  return res;
}
