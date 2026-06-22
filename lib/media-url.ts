/**
 * Strapi 媒体 URL 解析（案例封面优先 formats，/uploads 拼接 CMS 公网地址）
 */

export type StrapiMediaFormats = {
  large?: { url?: string };
  medium?: { url?: string };
  small?: { url?: string };
  thumbnail?: { url?: string };
};

export type StrapiMediaLike = {
  url?: string;
  formats?: StrapiMediaFormats;
};

export function getPublicCmsUrl(): string {
  return (
    process.env.NEXT_PUBLIC_CMS_URL ||
    process.env.CMS_URL ||
    "http://localhost:1337"
  ).replace(/\/$/, "");
}

/** Strapi v5 可能嵌套 data / attributes，统一解包 */
export function unwrapStrapiMedia(media: unknown): StrapiMediaLike | null {
  if (!media || typeof media !== "object") return null;
  const record = media as Record<string, unknown>;
  if (record.data != null) return unwrapStrapiMedia(record.data);
  if (record.attributes != null && typeof record.attributes === "object") {
    return record.attributes as StrapiMediaLike;
  }
  return media as StrapiMediaLike;
}

function pickFormatUrl(
  formats: StrapiMediaFormats | undefined,
  ...keys: (keyof StrapiMediaFormats)[]
): string {
  if (!formats) return "";
  for (const key of keys) {
    const url = formats[key]?.url;
    if (url) return url;
  }
  return "";
}

function pickFromMediaField(
  field: StrapiMediaLike | null | undefined,
  formatKeys: (keyof StrapiMediaFormats)[]
): string {
  if (!field) return "";
  const fromFormats = pickFormatUrl(field.formats, ...formatKeys);
  if (fromFormats) return fromFormats;
  return field.url ?? "";
}

export type CaseMediaSource = {
  image?: unknown;
  cover?: unknown;
  thumbnail?: unknown;
};

/** 案例封面 URL 优先级（Strapi 原始相对路径） */
export function pickCaseMediaPath(doc: CaseMediaSource): string {
  const image = unwrapStrapiMedia(doc.image);
  const cover = unwrapStrapiMedia(doc.cover);
  const thumbnail = unwrapStrapiMedia(doc.thumbnail);

  const candidates = [
    pickFromMediaField(image, ["large", "medium"]),
    image?.url,
    pickFromMediaField(cover, ["large"]),
    cover?.url,
    pickFromMediaField(thumbnail, ["medium"]),
    thumbnail?.url,
  ];

  for (const raw of candidates) {
    if (typeof raw === "string" && raw.trim()) return raw.trim();
  }
  return "";
}

/**
 * /uploads/* → 绝对 CMS 地址（优先 NEXT_PUBLIC_CMS_URL）
 * 其他相对路径可走同源 /strapi-uploads 代理（本地开发）
 */
export function resolveCmsAssetUrl(
  rawUrl: string,
  cmsUrl = getPublicCmsUrl()
): string {
  if (!rawUrl) return "";

  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }

  if (rawUrl.startsWith("/uploads/")) {
    return `${cmsUrl}${rawUrl}`;
  }

  if (rawUrl.startsWith("/strapi-uploads/")) {
    return rawUrl;
  }

  if (rawUrl.startsWith("/")) {
    return toPublicMediaUrl(cmsUrl, rawUrl);
  }

  return `${cmsUrl}/${rawUrl}`;
}

export function resolveCaseImageUrl(
  doc: CaseMediaSource,
  cmsUrl = getPublicCmsUrl()
): string {
  return resolveCmsAssetUrl(pickCaseMediaPath(doc), cmsUrl);
}

export function resolveCaseGalleryUrls(
  gallery: unknown[] | null | undefined,
  cmsUrl = getPublicCmsUrl()
): string[] {
  return (gallery ?? [])
    .map((item) => {
      const media = unwrapStrapiMedia(item);
      const picked =
        pickFromMediaField(media, ["large", "medium", "small"]) ||
        media?.url ||
        "";
      return resolveCmsAssetUrl(picked, cmsUrl);
    })
    .filter(Boolean);
}

/**
 * Strapi 媒体 URL → 本站同源路径，手机预览时不再依赖 localhost:1337
 */
export function toPublicMediaUrl(cmsUrl: string, mediaUrl: string): string {
  if (!mediaUrl) return "";
  if (mediaUrl.startsWith("/strapi-uploads/")) return mediaUrl;

  try {
    const parsed = new URL(mediaUrl, cmsUrl);
    const uploadPath = parsed.pathname.match(/\/uploads\/.+/)?.[0];
    if (uploadPath) {
      return `/strapi-uploads${uploadPath.replace(/^\/uploads/, "")}`;
    }
  } catch {
    /* ignore */
  }

  if (mediaUrl.startsWith("/uploads/")) {
    return `/strapi-uploads${mediaUrl.replace(/^\/uploads/, "")}`;
  }

  if (mediaUrl.startsWith("http")) return mediaUrl;
  if (mediaUrl.startsWith("/")) return mediaUrl;
  return `${cmsUrl}${mediaUrl}`;
}
