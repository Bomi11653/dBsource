/**
 * Strapi 媒体 URL 解析（浏览器端统一同源 /strapi-uploads，由 Next rewrite 反代 Strapi）
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
  gallery?: unknown[] | null;
};

export type DownloadFileSource = {
  file?: unknown;
  attachment?: unknown;
  downloadFile?: unknown;
  fileUrl?: string | null;
};

/** 仅用于后台状态展示，不作为浏览器图片 base */
export function getPublicCmsUrl(): string {
  return (process.env.NEXT_PUBLIC_CMS_URL || "").replace(/\/$/, "");
}

const PRIVATE_HOST_RE =
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/i;

function extractUploadsPath(pathname: string): string | null {
  const match = pathname.match(/(\/uploads\/.*)$/);
  return match ? match[1] : null;
}

function isLoopbackOrPrivateHost(hostname: string): boolean {
  return PRIVATE_HOST_RE.test(hostname);
}

function toBrowserUploadsPath(uploadPath: string): string {
  const normalized = uploadPath.startsWith("/uploads/")
    ? uploadPath
    : uploadPath.startsWith("/strapi-uploads/")
      ? uploadPath.replace(/^\/strapi-uploads/, "/uploads")
      : `/uploads/${uploadPath.replace(/^\//, "")}`;
  return normalized.replace(/^\/uploads/, "/strapi-uploads");
}

/**
 * 浏览器可访问的媒体 URL：
 * - Strapi /uploads → 同源 /strapi-uploads/xxx（Next.js rewrite 已验证可用）
 * - 不输出 127.0.0.1:1337 / 内网 CMS 地址
 */
export function resolveBrowserMediaUrl(rawUrl: string): string {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // LKG 缓存或旧 HTML 中的内网 / 1337 端口地址
  if (
    trimmed.includes("127.0.0.1") ||
    trimmed.includes("localhost") ||
    /:1337\b/.test(trimmed)
  ) {
    const uploadMatch = trimmed.match(/\/uploads\/[^\s"'?#]+/);
    if (uploadMatch) {
      return toBrowserUploadsPath(uploadMatch[0]);
    }
    return "";
  }

  if (trimmed.startsWith("/strapi-uploads/")) {
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/")) {
    return toBrowserUploadsPath(trimmed);
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      const uploadPath = extractUploadsPath(parsed.pathname);
      if (uploadPath) {
        return toBrowserUploadsPath(uploadPath);
      }
      if (isLoopbackOrPrivateHost(parsed.hostname)) {
        return "";
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  if (trimmed.startsWith("/")) {
    const uploadPath = extractUploadsPath(trimmed);
    if (uploadPath) return toBrowserUploadsPath(uploadPath);
    return trimmed;
  }

  if (trimmed.startsWith("uploads/")) {
    return toBrowserUploadsPath(`/${trimmed}`);
  }

  return toBrowserUploadsPath(`/uploads/${trimmed.replace(/^\//, "")}`);
}

/** 服务端（Node）访问 Strapi 媒体：内网 CMS + /uploads 路径 */
export function resolveServerMediaUrl(
  rawUrl: string,
  cmsUrl = (
    process.env.CMS_URL ||
    process.env.NEXT_PUBLIC_CMS_URL ||
    "http://localhost:1337"
  ).replace(/\/$/, "")
): string {
  const browser = resolveBrowserMediaUrl(rawUrl);
  if (!browser) return "";
  if (browser.startsWith("/strapi-uploads/")) {
    return `${cmsUrl}${browser.replace(/^\/strapi-uploads/, "/uploads")}`;
  }
  if (browser.startsWith("/uploads/")) {
    return `${cmsUrl}${browser}`;
  }
  if (browser.startsWith("http://") || browser.startsWith("https://")) {
    return browser;
  }
  if (browser.startsWith("/")) {
    return `${cmsUrl}${browser}`;
  }
  return browser;
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

/** Strapi v5 gallery 可能是数组或 { data: [] } */
export function unwrapStrapiGallery(gallery: unknown): unknown[] {
  if (!gallery) return [];
  if (Array.isArray(gallery)) return gallery;
  if (typeof gallery === "object" && gallery !== null) {
    const data = (gallery as { data?: unknown }).data;
    if (Array.isArray(data)) return data;
  }
  return [];
}

/**
 * 图片相对路径优先级（Strapi 原始路径）
 */
export function pickMediaPath(source: MediaSource): string {
  const image = unwrapStrapiMedia(source.image);
  const cover = unwrapStrapiMedia(source.cover);
  const thumbnail = unwrapStrapiMedia(source.thumbnail);
  const galleryFirst = unwrapStrapiMedia(unwrapStrapiGallery(source.gallery)[0]);

  const candidates = [
    image?.formats?.large?.url,
    image?.formats?.medium?.url,
    image?.url,
    cover?.formats?.large?.url,
    cover?.formats?.medium?.url,
    cover?.url,
    thumbnail?.formats?.large?.url,
    thumbnail?.formats?.medium?.url,
    thumbnail?.url,
    galleryFirst?.formats?.large?.url,
    galleryFirst?.formats?.medium?.url,
    galleryFirst?.url,
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
 * Strapi 媒体路径 → 浏览器同源 URL（/uploads/...）
 * @param _cmsUrl 保留兼容旧调用，不再用于拼接 127.0.0.1
 */
export function resolveCmsAssetUrl(rawUrl: string, _cmsUrl?: string): string {
  return resolveBrowserMediaUrl(rawUrl);
}

export function resolveMediaUrlFromSource(
  source: MediaSource,
  _cmsUrl?: string
): string {
  return resolveCmsAssetUrl(pickMediaPath(source), _cmsUrl);
}

export function resolveCaseImageUrl(
  doc: CaseMediaSource,
  cmsUrl?: string
): string {
  return resolveMediaUrlFromSource(doc, cmsUrl);
}

export function resolveDownloadFileUrl(
  doc: DownloadFileSource,
  _cmsUrl?: string
): string {
  return resolveCmsAssetUrl(pickDownloadFilePath(doc), _cmsUrl);
}

/** 单 media 字段 → 本站可访问 URL */
export function resolveStrapiMediaUrl(
  media: unknown,
  cmsUrl?: string
): string {
  return resolveMediaUrlFromSource({ image: media }, cmsUrl);
}

export function resolveCaseGalleryUrls(
  gallery: unknown[] | null | undefined,
  _cmsUrl?: string
): string[] {
  return (gallery ?? [])
    .map((item) => {
      const media = unwrapStrapiMedia(item);
      const picked =
        pickFromMediaField(media, ["large", "medium", "small"]) ||
        media?.url ||
        "";
      return resolveCmsAssetUrl(picked);
    })
    .filter(Boolean);
}

/**
 * @deprecated 使用 resolveBrowserMediaUrl
 */
export function toPublicMediaUrl(_cmsUrl: string, mediaUrl: string): string {
  return resolveBrowserMediaUrl(mediaUrl);
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

/** 案例标题：titleZh → title → nameZh → name → titleEn → fallback */
export function pickCaseTitleZh(doc: TitleSource, fallback = "未命名案例"): string {
  return pickString(doc.titleZh, doc.title, doc.nameZh, doc.name, doc.titleEn) || fallback;
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
