import { PRODUCTION_SITE_URL } from "@/lib/seo";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE = "dbsource_admin_token";

export function getConfiguredSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL).replace(/\/$/, "");
}

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

/** HTTPS 正式环境启用 Secure Cookie；本地 HTTP / IP 预览必须为 false */
export function isAdminCookieSecure(request?: NextRequest): boolean {
  if (request) {
    const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    if (forwarded === "https") return true;
    if (request.nextUrl.protocol === "https:") return true;
  }
  return getConfiguredSiteUrl().startsWith("https://");
}

/**
 * 正式域名下共享 www 与根域 Cookie（如 .dbsource-pro.com）。
 * 本地开发不设置 domain，避免污染浏览器。
 */
export function getAdminCookieDomain(): string | undefined {
  const siteUrl = getConfiguredSiteUrl();
  if (!siteUrl.startsWith("https://")) return undefined;

  try {
    const { hostname } = new URL(siteUrl);
    if (hostname === "localhost" || hostname === "127.0.0.1") return undefined;
    if (hostname.startsWith("www.")) {
      return `.${hostname.slice(4)}`;
    }
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      return `.${parts.slice(-2).join(".")}`;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function adminCookieOptions(maxAge = 60 * 60 * 24 * 7, request?: NextRequest) {
  const secure = isAdminCookieSecure(request);
  const domain = secure ? getAdminCookieDomain() : undefined;

  return {
    httpOnly: true,
    secure,
    /* lax：登录后跳转 /admin 更稳；HTTPS 下仍防 CSRF */
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    ...(domain ? { domain } : {}),
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
