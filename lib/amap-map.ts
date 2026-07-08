const AMAP_ALLOWED_HOSTS = new Set([
  "amap.com",
  "www.amap.com",
  "uri.amap.com",
  "map.amap.com",
  "m.amap.com",
  "ditu.amap.com",
  "webapi.amap.com",
  "restapi.amap.com",
  "lbs.amap.com",
]);

function isBlockedProtocol(value: string): boolean {
  const lower = value.trim().toLowerCase();
  return (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  );
}

function isAllowedAmapHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return AMAP_ALLOWED_HOSTS.has(host) || host.endsWith(".amap.com");
}

/** Extract src from pasted iframe markup or return the raw URL. */
export function extractMapEmbedSrc(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const iframeMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch?.[1]) return iframeMatch[1].trim();

  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (srcMatch?.[1]) return srcMatch[1].trim();

  return trimmed;
}

/** iframe embed URL must be http(s) on an Amap domain; javascript/data are blocked. */
export function isAllowedAmapEmbedUrl(url: string): boolean {
  const src = extractMapEmbedSrc(url);
  if (!src || isBlockedProtocol(src)) return false;

  try {
    const parsed = new URL(src);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    return isAllowedAmapHost(parsed.hostname);
  } catch {
    return false;
  }
}

/** Normalized embed src when the CMS value is allowed; otherwise empty. */
export function resolveMapEmbedSrc(mapEmbedUrl?: string): string {
  const src = extractMapEmbedSrc(mapEmbedUrl?.trim() ?? "");
  if (!src || !isAllowedAmapEmbedUrl(src)) return "";
  return src;
}

export function buildAmapNavUrl(keyword: string): string {
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(keyword.trim())}`;
}

/** Prefer CMS mapNavUrl; otherwise build from mapQuery or address fallback. */
export function resolveMapNavUrl(
  mapNavUrl?: string,
  mapQuery?: string,
  addressFallback?: string
): string {
  const nav = mapNavUrl?.trim();
  if (nav && !isBlockedProtocol(nav)) {
    try {
      const parsed = new URL(nav);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return nav;
      }
    } catch {
      /* fall through */
    }
  }

  const query = mapQuery?.trim() || addressFallback?.trim();
  return query ? buildAmapNavUrl(query) : "";
}
