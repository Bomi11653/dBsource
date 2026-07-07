const AMAP_ALLOWED_HOSTS = new Set([
  "amap.com",
  "www.amap.com",
  "uri.amap.com",
  "map.amap.com",
  "webapi.amap.com",
  "restapi.amap.com",
]);

function isAllowedAmapHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return AMAP_ALLOWED_HOSTS.has(host) || host.endsWith(".amap.com");
}

/** iframe embed URL must be https and on an Amap domain. */
export function isAllowedAmapEmbedUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" && isAllowedAmapHost(parsed.hostname);
  } catch {
    return false;
  }
}

export function buildAmapNavUrl(keyword: string): string {
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(keyword.trim())}`;
}

/** Prefer CMS mapNavUrl; otherwise build from mapQuery. */
export function resolveMapNavUrl(mapNavUrl?: string, mapQuery?: string): string {
  const nav = mapNavUrl?.trim();
  if (nav) {
    try {
      const parsed = new URL(nav);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return nav;
      }
    } catch {
      /* fall through */
    }
  }

  const query = mapQuery?.trim();
  return query ? buildAmapNavUrl(query) : "";
}
