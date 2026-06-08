import { ADMIN_COOKIE, extractAdminToken, getAdminTokenEnv, verifyAdminToken } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const expected = getAdminTokenEnv();
  if (!expected) return NextResponse.next();

  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  const token = extractAdminToken(request);
  if (verifyAdminToken(token)) return NextResponse.next();

  if (isAdminApi) {
    return NextResponse.json({ ok: false, error: "未授权" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
