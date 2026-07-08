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

const AMAP_URI_HOSTS = new Set(["uri.amap.com", "www.uri.amap.com"]);

const AMAP_SRC = "dbsource";

type AmapCoords = {
  lng: number;
  lat: number;
  name?: string;
};

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

function isSafeHttpUrl(url: string): boolean {
  if (isBlockedProtocol(url)) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function isUriAmapUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return AMAP_URI_HOSTS.has(host);
  } catch {
    return false;
  }
}

function looksLikeCoordPair(lng: number, lat: number): boolean {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return false;
  // Prefer China bounds to avoid treating arbitrary "a,b" text as coordinates.
  return lng >= 70 && lng <= 140 && lat >= 15 && lat <= 55;
}

function parseCoordPair(lngStr: string, latStr: string, name?: string): AmapCoords | null {
  const lng = Number(lngStr.trim());
  const lat = Number(latStr.trim());
  if (!looksLikeCoordPair(lng, lat)) return null;
  const trimmedName = name?.trim();
  return { lng, lat, name: trimmedName || undefined };
}

/** Parse "lng,lat" or "lng,lat,name" from mapQuery. */
export function parseCoordsFromMapQuery(value: string): AmapCoords | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*(.+))?$/);
  if (!match) return null;
  return parseCoordPair(match[1], match[2], match[3]);
}

function parseCoordsFromParamValue(value: string, nameFallback?: string): AmapCoords | null {
  const parts = value.split(",");
  if (parts.length < 2) return null;
  const name = parts.length > 2 ? parts.slice(2).join(",").trim() : nameFallback;
  return parseCoordPair(parts[0], parts[1], name);
}

/** Extract lng/lat from mapNavUrl query params such as position= or to=. */
export function parseCoordsFromMapNavUrl(url: string): AmapCoords | null {
  if (!isSafeHttpUrl(url)) return null;

  try {
    const parsed = new URL(url);
    const params = parsed.searchParams;
    const name = params.get("name") || undefined;

    const position = params.get("position");
    if (position) {
      const coords = parseCoordsFromParamValue(position, name);
      if (coords) return coords;
    }

    const to = params.get("to");
    if (to) {
      const coords = parseCoordsFromParamValue(to, name);
      if (coords) return coords;
    }

    const coordinate = params.get("coordinate") || params.get("coords");
    if (coordinate) {
      const coords = parseCoordsFromParamValue(coordinate, name);
      if (coords) return coords;
    }
  } catch {
    return null;
  }

  return null;
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

export function buildAmapSearchUrl(keyword: string): string {
  const params = new URLSearchParams({
    keyword: keyword.trim(),
    src: AMAP_SRC,
  });
  return `https://uri.amap.com/search?${params.toString()}`;
}

/** @deprecated Use buildAmapSearchUrl */
export function buildAmapNavUrl(keyword: string): string {
  return buildAmapSearchUrl(keyword);
}

export function buildAmapNavigationUrl(lng: number, lat: number, name?: string): string {
  const label = name?.trim() ?? "";
  const to = label ? `${lng},${lat},${label}` : `${lng},${lat}`;
  const params = new URLSearchParams({
    to,
    mode: "car",
    policy: "1",
    src: AMAP_SRC,
  });
  return `https://uri.amap.com/navigation?${params.toString()}`;
}

export function buildAmapMarkerUrl(lng: number, lat: number, name?: string): string {
  const params = new URLSearchParams({
    position: `${lng},${lat}`,
    src: AMAP_SRC,
  });
  if (name?.trim()) params.set("name", name.trim());
  return `https://uri.amap.com/marker?${params.toString()}`;
}

/**
 * Resolve a lightweight Amap URI link for the nav button.
 * Priority: uri.amap.com mapNavUrl → coords → address search.
 * Web map pages (www/ditu/m.amap.com) are never used directly.
 */
export function resolveMapNavUrl(
  mapNavUrl?: string,
  mapQuery?: string,
  addressFallback?: string
): string {
  const nav = mapNavUrl?.trim();
  const query = mapQuery?.trim();
  const address = addressFallback?.trim();
  const placeName = address || (query && !parseCoordsFromMapQuery(query) ? query : "") || "";

  if (nav && isSafeHttpUrl(nav) && isUriAmapUrl(nav)) {
    return nav;
  }

  let coords: AmapCoords | null = null;

  if (query) {
    coords = parseCoordsFromMapQuery(query);
  }

  if (!coords && nav && isSafeHttpUrl(nav)) {
    coords = parseCoordsFromMapNavUrl(nav);
  }

  if (coords) {
    return buildAmapNavigationUrl(coords.lng, coords.lat, coords.name || placeName);
  }

  // Web map pages (www/ditu/m.amap.com) are never used for the nav button.

  if (query) {
    return buildAmapSearchUrl(query);
  }

  if (address) {
    return buildAmapSearchUrl(address);
  }

  return "";
}
