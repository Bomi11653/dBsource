import { getCmsUrl } from "@/lib/strapi-client";
import { NextRequest } from "next/server";

/** 手机预览时把 localhost 换成当前访问 IP，便于浏览器直传 Strapi */
export function resolveClientCmsUrl(request: NextRequest): string {
  const base = getCmsUrl();
  const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!hostHeader) return base;

  const clientHost = hostHeader.split(",")[0]?.trim().split(":")[0];
  if (!clientHost || clientHost === "localhost" || clientHost === "127.0.0.1") {
    return base;
  }

  try {
    const parsed = new URL(base);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      parsed.hostname = clientHost;
      return parsed.toString().replace(/\/$/, "");
    }
  } catch {
    /* keep base */
  }

  return base;
}
