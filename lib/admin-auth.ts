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

export function assertAdminRequest(request: NextRequest): NextResponse | null {
  if (!isAdminAuthEnabled()) return null;
  if (verifyAdminToken(extractAdminToken(request))) return null;
  return unauthorizedAdminResponse();
}
