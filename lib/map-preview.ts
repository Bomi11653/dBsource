import type { AmapCoords } from "@/lib/amap-map";

export function buildAmapStaticMapUrl(
  coords: AmapCoords,
  key: string,
  width = 640,
  height = 320
): string {
  const { lng, lat } = coords;
  const params = new URLSearchParams({
    location: `${lng},${lat}`,
    zoom: "15",
    size: `${width}*${height}`,
    scale: "2",
    markers: `mid,,A:${lng},${lat}`,
    key,
  });
  return `https://restapi.amap.com/v3/staticmap?${params.toString()}`;
}

export function buildOsmEmbedUrl(coords: AmapCoords): string {
  const { lng, lat } = coords;
  const pad = 0.018;
  const bbox = [lng - pad, lat - pad, lng + pad, lat + pad].join(",");
  const params = new URLSearchParams({
    bbox,
    layer: "mapnik",
    marker: `${lat},${lng}`,
  });
  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

/** 无外链静态图时的 SVG 地图缩略图（道路 + 绿地 + 定位点） */
export function buildMapPreviewSvg(width = 640, height = 320): string {
  const cx = width / 2;
  const cy = height / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-hidden="true">
  <defs>
    <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e4e9df"/>
      <stop offset="100%" stop-color="#cdd8c4"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#mapBg)"/>
  <rect x="36" y="28" width="148" height="92" rx="6" fill="#a8c896" opacity="0.75"/>
  <rect x="468" y="196" width="128" height="88" rx="6" fill="#a8c896" opacity="0.75"/>
  <rect x="392" y="36" width="96" height="64" rx="4" fill="#b9cfe8" opacity="0.55"/>
  <path d="M0 ${cy} H${width}" stroke="#ffffff" stroke-width="16"/>
  <path d="M0 ${cy} H${width}" stroke="#ece5d4" stroke-width="10"/>
  <path d="M${cx} 0 V${height}" stroke="#ffffff" stroke-width="14"/>
  <path d="M${cx} 0 V${height}" stroke="#ece5d4" stroke-width="9"/>
  <path d="M0 ${height * 0.28} Q${width * 0.35} ${height * 0.22} ${width * 0.62} ${height * 0.34} T${width} ${height * 0.26}" stroke="#ffffff" stroke-width="9" fill="none"/>
  <path d="M0 ${height * 0.72} Q${width * 0.4} ${height * 0.78} ${width * 0.7} ${height * 0.66} T${width} ${height * 0.74}" stroke="#ffffff" stroke-width="7" fill="none"/>
  <rect x="${width * 0.18}" y="${height * 0.58}" width="72" height="48" fill="#ddd3c4" opacity="0.85" rx="3"/>
  <rect x="${width * 0.56}" y="${height * 0.48}" width="88" height="56" fill="#ddd3c4" opacity="0.85" rx="3"/>
  <circle cx="${cx}" cy="${cy}" r="22" fill="#d4a853" opacity="0.22"/>
  <path d="M${cx} ${cy - 28} c-13 0-24 11-24 24 c0 18 24 42 24 42 s24-24 24-42 c0-13-11-24-24-24z" fill="#d4a853"/>
  <circle cx="${cx}" cy="${cy - 6}" r="8" fill="#ffffff"/>
</svg>`;
}

export async function fetchMapPreviewImage(
  coords: AmapCoords
): Promise<{ body: ArrayBuffer | string; contentType: string }> {
  const key = process.env.AMAP_WEB_KEY || process.env.NEXT_PUBLIC_AMAP_WEB_KEY;

  if (key) {
    try {
      const url = buildAmapStaticMapUrl(coords, key);
      const res = await fetch(url, { next: { revalidate: 86400 } });
      const type = res.headers.get("content-type") ?? "";
      if (res.ok && type.includes("image")) {
        return { body: await res.arrayBuffer(), contentType: type };
      }
    } catch {
      // fall through
    }
  }

  const osmUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lng}&zoom=15&size=640x320&scale=2&markers=${coords.lat},${coords.lng},red-pushpin`;
  try {
    const res = await fetch(osmUrl, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      if (buf.byteLength > 500) {
        return { body: buf, contentType: "image/png" };
      }
    }
  } catch {
    // fall through
  }

  return {
    body: buildMapPreviewSvg(),
    contentType: "image/svg+xml; charset=utf-8",
  };
}
