import { getCmsUrl } from "@/lib/strapi-client";

let cached: { ok: boolean; status: number | null; errorMessage?: string; at: number } | null =
  null;
const TTL_MS = 15_000;

export type StrapiProbeResult = {
  ok: boolean;
  status: number | null;
  errorMessage?: string;
  checkedAt: string;
};

/** 探测 Strapi REST API（短超时，带 15s 内存缓存） */
export async function probeStrapiApi(): Promise<StrapiProbeResult> {
  const checkedAt = new Date().toISOString();

  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
    return { ok: false, status: null, errorMessage: "USE_MOCK_DATA=true", checkedAt };
  }

  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) {
    return {
      ok: cached.ok,
      status: cached.status,
      errorMessage: cached.errorMessage,
      checkedAt,
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${getCmsUrl()}/api/products?pagination[pageSize]=1`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    const ok = res.ok;
    const errorMessage = ok ? undefined : `Strapi HTTP ${res.status}`;
    cached = { ok, status: res.status, errorMessage, at: now };
    return { ok, status: res.status, errorMessage, checkedAt };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Strapi 连接失败";
    cached = { ok: false, status: null, errorMessage, at: now };
    return { ok: false, status: null, errorMessage, checkedAt };
  }
}

/** @deprecated 使用 probeStrapiApi */
export async function isCmsAvailable(): Promise<boolean> {
  const probe = await probeStrapiApi();
  return probe.ok;
}

export function resetCmsHealthCache() {
  cached = null;
}
