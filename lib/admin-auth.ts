import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE = "dbsource_admin_token";

export function getAdminTokenEnv(): string | null {
  return process.env.ADMIN_TOKEN?.trim() || null;
}

export function isAdminAuthEnabled(): boolean {
  return Boolean(getAdminTokenEnv());
}

export function verifyAdminToken(token: string | null | undefined): boolean {
  const expected = getAdminTokenEnv();
  if (!expected) return true;
  return token === expected;
}

export async function getAdminTokenFromCookies(): Promise<string | null> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value ?? null;
}

export function unauthorizedAdminResponse() {
  return NextResponse.json({ ok: false, error: "未授权，请先登录管理后台" }, { status: 401 });
}

export function extractAdminToken(request: NextRequest): string | null {
  return (
    request.headers.get("x-admin-token") ||
    request.cookies.get(ADMIN_COOKIE)?.value ||
    request.nextUrl.searchParams.get("token")
  );
}

/** 仅当 NEXT_PUBLIC_SITE_URL 为 https 时启用 Secure Cookie（HTTP/IP 测试环境必须为 false） */
export function isAdminCookieSecure(): boolean {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  return siteUrl.startsWith("https://");
}

export function adminCookieOptions(maxAge = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: isAdminCookieSecure(),
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}

export function assertAdminRequest(request: NextRequest): NextResponse | null {
  if (!isAdminAuthEnabled()) {
    /* 本地开发免登录；生产环境必须配置 ADMIN_TOKEN，否则锁定全部后台接口 */
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { ok: false, error: "生产环境未配置 ADMIN_TOKEN，后台接口已锁定" },
        { status: 401 }
      );
    }
    return null;
  }
  if (verifyAdminToken(extractAdminToken(request))) return null;
  return unauthorizedAdminResponse();
}
