import {
  ADMIN_COOKIE,
  extractAdminToken,
  getAdminTokenEnv,
  verifyAdminToken,
} from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const expected = getAdminTokenEnv();
  if (!expected) return NextResponse.next();

  const { pathname } = request.nextUrl;

  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout"
  ) {
    return NextResponse.next();
  }

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  const token = extractAdminToken(request);
  if (verifyAdminToken(token)) return NextResponse.next();

  if (pathname === "/admin/login" || pathname === "/api/admin/logout") {
    return NextResponse.next();
  }

  /* API 必须返回 JSON，避免 fetch 跟随重定向拿到登录页 HTML 后“静默失败” */
  if (isAdminApi) {
    return NextResponse.json(
      { ok: false, error: "未授权，请先登录管理后台后再试。" },
      { status: 401 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dbsource-pro.com";

  const loginUrl = new URL("/admin/login", siteUrl);
  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
