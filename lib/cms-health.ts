import { getCmsUrl } from "@/lib/strapi-client";

let cached: { ok: boolean; at: number } | null = null;
const TTL_MS = 30_000;

/** 检测 Strapi 是否在线（带 30s 内存缓存） */
export async function isCmsAvailable(): Promise<boolean> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") return false;

  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) return cached.ok;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${getCmsUrl()}/api/products?pagination[pageSize]=1`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    const ok = res.ok;
    cached = { ok, at: now };
    return ok;
  } catch {
    cached = { ok: false, at: now };
    return false;
  }
}

export function resetCmsHealthCache() {
  cached = null;
}
