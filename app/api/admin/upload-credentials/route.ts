import { assertAdminRequest } from "@/lib/admin-auth";
import { resolveClientCmsUrl } from "@/lib/resolve-client-cms-url";
import { getAdminToken } from "@/lib/strapi-admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** 返回 Strapi 直传凭证（仅已登录后台可用，Token 不落前端 bundle） */
export async function GET(request: NextRequest) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const token = getAdminToken();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "未配置 STRAPI_API_TOKEN，请在 .env.local 添加后重启预览。" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    cmsUrl: resolveClientCmsUrl(request),
    token,
  });
}
