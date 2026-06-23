/**
 * Strapi 媒体 URL 解析（统一 formats 优先级，/uploads 拼接 CMS 公网地址）
 */

export type StrapiMediaFormats = {
  large?: { url?: string };
  medium?: { url?: string };
  small?: { url?: string };
  thumbnail?: { url?: string };
};

export type StrapiMediaLike = {
  url?: string;
  name?: string;
  size?: number;
  formats?: StrapiMediaFormats;
};

export type MediaSource = {
  image?: unknown;
  cover?: unknown;
  thumbnail?: unknown;
};

export type DownloadFileSource = {
  file?: unknown;
  attachment?: unknown;
  downloadFile?: unknown;
  fileUrl?: string | null;
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

/** 开发环境：提示哪条 Strapi 数据缺字段 */
export function warnStrapiMapping(
  entity: string,
  id: string | number | undefined,
  missing: string[]
): void {
  if (process.env.NODE_ENV !== "development" || missing.length === 0) return;
  const label = id != null ? `${entity} #${id}` : entity;
  console.warn(`[Strapi mapping] ${label} 缺少字段: ${missing.join(", ")}`);
}

/**
 * 图片相对路径优先级（Strapi 原始路径）：
 * image.formats.large → medium → url → cover.formats.large → cover.url →
 * thumbnail.formats.medium → thumbnail.url
 */
export function pickMediaPath(source: MediaSource): string {
  const image = unwrapStrapiMedia(source.image);
  const cover = unwrapStrapiMedia(source.cover);
  const thumbnail = unwrapStrapiMedia(source.thumbnail);

  const candidates = [
    image?.formats?.large?.url,
    image?.formats?.medium?.url,
    image?.url,
    cover?.formats?.large?.url,
    cover?.url,
    thumbnail?.formats?.medium?.url,
    thumbnail?.url,
  ];

  for (const raw of candidates) {
    if (typeof raw === "string" && raw.trim()) return raw.trim();
  }
  return "";
}

export type CaseMediaSource = MediaSource;

/** @deprecated 使用 pickMediaPath */
export function pickCaseMediaPath(doc: CaseMediaSource): string {
  return pickMediaPath(doc);
}

/**
 * 下载文件相对路径优先级：
 * file.url → attachment.url → downloadFile.url → fileUrl（非 #）
 */
export function pickDownloadFilePath(doc: DownloadFileSource): string {
  const file = unwrapStrapiMedia(doc.file);
  const attachment = unwrapStrapiMedia(doc.attachment);
  const downloadFile = unwrapStrapiMedia(doc.downloadFile);

  const candidates = [file?.url, attachment?.url, downloadFile?.url];
  for (const raw of candidates) {
    if (typeof raw === "string" && raw.trim()) return raw.trim();
  }

  const legacy = doc.fileUrl?.trim();
  if (legacy && legacy !== "#") return legacy;
  return "";
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

export function resolveMediaUrlFromSource(
  source: MediaSource,
  cmsUrl = getPublicCmsUrl()
): string {
  return resolveCmsAssetUrl(pickMediaPath(source), cmsUrl);
}

export function resolveCaseImageUrl(
  doc: CaseMediaSource,
  cmsUrl = getPublicCmsUrl()
): string {
  return resolveMediaUrlFromSource(doc, cmsUrl);
}

export function resolveDownloadFileUrl(
  doc: DownloadFileSource,
  cmsUrl = getPublicCmsUrl()
): string {
  return resolveCmsAssetUrl(pickDownloadFilePath(doc), cmsUrl);
}

/** 单 media 字段 → 本站可访问 URL */
export function resolveStrapiMediaUrl(
  media: unknown,
  cmsUrl = getPublicCmsUrl()
): string {
  return resolveMediaUrlFromSource({ image: media }, cmsUrl);
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

export type TitleSource = {
  titleZh?: string | null;
  titleEn?: string | null;
  title?: string | null;
  nameZh?: string | null;
  nameEn?: string | null;
  name?: string | null;
  file?: unknown;
};

function pickString(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

/** 下载标题：titleZh → title → nameZh → name → file.name → fallback */
export function pickDownloadTitleZh(doc: TitleSource, fallback = "未命名资源"): string {
  const fileName = unwrapStrapiMedia(doc.file)?.name;
  return (
    pickString(doc.titleZh, doc.title, doc.nameZh, doc.name, fileName) || fallback
  );
}

export function pickDownloadTitleEn(doc: TitleSource, fallback = "Untitled resource"): string {
  const fileName = unwrapStrapiMedia(doc.file)?.name;
  return (
    pickString(doc.titleEn, doc.title, doc.nameEn, doc.name, fileName) || fallback
  );
}

/** 案例标题：titleZh → title → nameZh → name → fallback */
export function pickCaseTitleZh(doc: TitleSource, fallback = "未命名案例"): string {
  return pickString(doc.titleZh, doc.title, doc.nameZh, doc.name) || fallback;
}

export function pickCaseTitleEn(doc: TitleSource, fallback = "Untitled case"): string {
  return pickString(doc.titleEn, doc.title, doc.nameEn, doc.name) || fallback;
}

/** 产品名称：nameZh → name → titleZh → title → model */
export function pickProductNameZh(
  doc: TitleSource & { model?: string | null },
  fallback = "未命名产品"
): string {
  return pickString(doc.nameZh, doc.name, doc.titleZh, doc.title, doc.model) || fallback;
}

export function pickProductNameEn(
  doc: TitleSource & { model?: string | null },
  fallback = "Untitled product"
): string {
  return pickString(doc.nameEn, doc.name, doc.titleEn, doc.title, doc.model) || fallback;
}
