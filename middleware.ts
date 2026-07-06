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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dbsource-pro.com";

  const loginUrl = new URL("/admin/login", siteUrl);
  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
