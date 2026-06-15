import { assertAdminRequest, isAdminAuthEnabled } from "@/lib/admin-auth";
import { resolveClientCmsUrl } from "@/lib/resolve-client-cms-url";
import { getAdminToken } from "@/lib/strapi-admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** 返回 Strapi 直传凭证（仅已登录后台可用，Token 不落前端 bundle） */
export async function GET(request: NextRequest) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  /* 未启用后台口令时绝不下发 Token（浏览器会自动回退到服务端代理上传） */
  if (!isAdminAuthEnabled()) {
    return NextResponse.json(
      { ok: false, error: "未配置 ADMIN_TOKEN，直传通道已禁用，将使用代理上传。" },
      { status: 403 }
    );
  }

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
