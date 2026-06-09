import { assertAdminRequest } from "@/lib/admin-auth";
import { getAdminToken } from "@/lib/strapi-admin";
import { getCmsUrl } from "@/lib/strapi-client";
import { NextRequest, NextResponse } from "next/server";

/** 大文件上传（ZIP/PDF/安装包）允许最长 5 分钟 */
export const maxDuration = 300;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UploadResponse = Array<{ id: number; url: string; name?: string; size?: number }>;

export async function POST(request: NextRequest) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const token = getAdminToken();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "未配置 STRAPI_API_TOKEN，请在 .env.local 添加后重启预览。" },
      { status: 500 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ ok: false, error: "请使用 multipart 表单上传文件" }, { status: 400 });
  }

  if (!request.body) {
    return NextResponse.json({ ok: false, error: "请求体为空" }, { status: 400 });
  }

  try {
    // 回退通道：浏览器直传 Strapi 失败时经此代理（流式转发，不整文件进内存）
    const upstream = await fetch(`${getCmsUrl()}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": contentType,
      },
      body: request.body,
      duplex: "half",
      cache: "no-store",
    } as RequestInit);

    if (!upstream.ok) {
      const errText = await upstream.text();
      let message = errText || `Strapi 上传失败 (${upstream.status})`;
      try {
        const parsed = JSON.parse(errText) as { error?: { message?: string } };
        message = parsed.error?.message ?? message;
      } catch {
        /* keep raw */
      }
      return NextResponse.json({ ok: false, error: message }, { status: 502 });
    }

    const json = (await upstream.json()) as UploadResponse;
    const uploaded = json[0];
    if (!uploaded?.id) {
      return NextResponse.json({ ok: false, error: "上传响应无效" }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      id: uploaded.id,
      url: uploaded.url,
      name: uploaded.name,
      size: uploaded.size,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "上传失败";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
