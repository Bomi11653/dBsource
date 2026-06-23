import { getPublicCmsUrl } from "@/lib/media-url";
import { probeStrapiApi } from "@/lib/cms-health";
import { getCmsUrl } from "@/lib/strapi-client";

export type ServiceHealthCheck = {
  ok: boolean;
  checkedAt: string;
  nextjs: { ok: boolean };
  strapi: {
    ok: boolean;
    status: number | null;
    cmsUrl: string;
    publicCmsUrl: string;
    uploadsProbe?: { ok: boolean; status: number | null; url: string };
    errorMessage?: string;
  };
  env: {
    strapiApiToken: boolean;
    revalidateSecret: boolean;
    cmsUrl: string;
    cmsUrlIsLocalhost: boolean;
    publicCmsUrl: string;
    useMockData: boolean;
    nodeEnv: string;
  };
  warnings: string[];
};

async function probeUploadsSample(cmsUrl: string, token: string | null): Promise<{
  ok: boolean;
  status: number | null;
  url: string;
}> {
  const listUrl = `${cmsUrl}/api/upload/files?pagination[pageSize]=1`;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(listUrl, { headers, cache: "no-store" });
    if (!res.ok) {
      return { ok: false, status: res.status, url: listUrl };
    }
    const json = (await res.json()) as Array<{ url?: string }>;
    const samplePath = json[0]?.url;
    if (!samplePath) {
      return { ok: true, status: 200, url: listUrl };
    }
    const absolute = samplePath.startsWith("http")
      ? samplePath
      : `${cmsUrl}${samplePath.startsWith("/") ? "" : "/"}${samplePath}`;
    const fileRes = await fetch(absolute, {
      method: "HEAD",
      headers,
      cache: "no-store",
    });
    return {
      ok: fileRes.ok,
      status: fileRes.status,
      url: absolute,
    };
  } catch {
    return { ok: false, status: null, url: listUrl };
  }
}

export async function runServiceHealthCheck(): Promise<ServiceHealthCheck> {
  const checkedAt = new Date().toISOString();
  const cmsUrl = getCmsUrl();
  const publicCmsUrl = getPublicCmsUrl();
  const token = process.env.STRAPI_API_TOKEN?.trim() || "";
  const revalidateSecret = process.env.REVALIDATE_SECRET?.trim() || "";
  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
  const warnings: string[] = [];

  const strapiProbe = await probeStrapiApi();

  if (!token) warnings.push("未配置 STRAPI_API_TOKEN");
  if (!revalidateSecret) warnings.push("未配置 REVALIDATE_SECRET");
  if (useMockData && process.env.NODE_ENV === "production") {
    warnings.push("生产环境 NEXT_PUBLIC_USE_MOCK_DATA 仍为 true");
  }
  if (!cmsUrl.includes("127.0.0.1") && !cmsUrl.includes("localhost")) {
    warnings.push(`CMS_URL 建议为 http://127.0.0.1:1337（当前: ${cmsUrl}）`);
  }
  if (!publicCmsUrl) warnings.push("未配置 NEXT_PUBLIC_CMS_URL");

  const uploadsProbe =
    strapiProbe.ok && token
      ? await probeUploadsSample(cmsUrl, token)
      : undefined;

  if (uploadsProbe && !uploadsProbe.ok) {
    warnings.push("Strapi uploads 文件探测失败");
  }

  const envOk =
    Boolean(token) &&
    Boolean(revalidateSecret) &&
    !useMockData &&
    (cmsUrl.includes("127.0.0.1") || cmsUrl.includes("localhost")) &&
    Boolean(publicCmsUrl);

  const ok = strapiProbe.ok && envOk && (uploadsProbe?.ok !== false);

  return {
    ok,
    checkedAt,
    nextjs: { ok: true },
    strapi: {
      ok: strapiProbe.ok,
      status: strapiProbe.status,
      cmsUrl,
      publicCmsUrl,
      uploadsProbe,
      errorMessage: strapiProbe.errorMessage,
    },
    env: {
      strapiApiToken: Boolean(token),
      revalidateSecret: Boolean(revalidateSecret),
      cmsUrl,
      cmsUrlIsLocalhost: cmsUrl.includes("127.0.0.1") || cmsUrl.includes("localhost"),
      publicCmsUrl,
      useMockData,
      nodeEnv: process.env.NODE_ENV || "development",
    },
    warnings,
  };
}
