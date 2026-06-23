import { mapCaseMediaFields } from "@/lib/case-media";
import {
  pickCaseTitleZh,
  pickDownloadFilePath,
  pickDownloadTitleZh,
  pickMediaPath,
  pickProductNameZh,
  resolveCmsAssetUrl,
  resolveServerMediaUrl,
  unwrapStrapiGallery,
  type DownloadFileSource,
  type MediaSource,
  type TitleSource,
} from "@/lib/media-url";
import { adminStrapiRequest } from "@/lib/strapi-admin";
import { getCmsUrl } from "@/lib/strapi-client";

export type HealthContentType = "cases" | "downloads" | "products";

export type HealthIssueRow = {
  contentType: HealthContentType;
  contentTypeLabel: string;
  id: string;
  documentId: string;
  title: string;
  imageUrl: string;
  reason: string;
  editHref: string;
};

export type HealthCheckSummary = {
  cases: { total: number; issues: number };
  downloads: { total: number; issues: number };
  products: { total: number; issues: number };
};

export type HealthCheckResult = {
  ok: boolean;
  checkedAt: string;
  summary: HealthCheckSummary;
  issues: HealthIssueRow[];
  error?: string;
};

type StrapiRow = Record<string, unknown> & {
  documentId?: string;
  id?: number;
  legacyId?: number;
  sortOrder?: number;
  model?: string | null;
  image?: unknown;
  cover?: unknown;
  thumbnail?: unknown;
  gallery?: unknown;
  file?: unknown;
  attachment?: unknown;
  downloadFile?: unknown;
  fileUrl?: string | null;
};

const CONTENT_LABEL: Record<HealthContentType, string> = {
  cases: "工程案例",
  downloads: "下载中心",
  products: "产品中心",
};

const EDIT_SECTION: Record<HealthContentType, string> = {
  cases: "cases",
  downloads: "downloads",
  products: "products",
};

const QUERIES: Record<HealthContentType, string> = {
  cases: "/cases?populate[image]=true&populate[gallery]=true&sort[0]=legacyId:asc&pagination[pageSize]=100",
  downloads:
    "/downloads?populate[cover]=true&populate[file]=true&sort[0]=sortOrder:asc&pagination[pageSize]=100",
  products: "/products?populate[image]=true&sort[0]=sortOrder:asc&pagination[pageSize]=200",
};

const SHARED_PLACEHOLDER_PATTERNS = [
  /cover-unit48\.png/i,
  /download-cover-\d+\.svg/i,
  /case-[12]\.svg/i,
];

function hasText(...values: Array<string | null | undefined>): boolean {
  return values.some((value) => typeof value === "string" && value.trim().length > 0);
}

function rowDocumentId(row: StrapiRow): string {
  return String(row.documentId ?? row.id ?? "");
}

function displayId(type: HealthContentType, row: StrapiRow): string {
  if (type === "cases" && row.legacyId != null) return String(row.legacyId);
  if (row.sortOrder != null) return String(row.sortOrder);
  return rowDocumentId(row) || "—";
}

function editHref(type: HealthContentType, documentId: string): string {
  return `/admin/${EDIT_SECTION[type]}?doc=${encodeURIComponent(documentId)}`;
}

function resolveAbsoluteUrl(rawPath: string, cmsUrl: string): string {
  if (!rawPath) return "";
  if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
    return resolveServerMediaUrl(rawPath, cmsUrl);
  }
  return resolveServerMediaUrl(resolveCmsAssetUrl(rawPath, cmsUrl), cmsUrl);
}

function pushIssue(
  issues: HealthIssueRow[],
  type: HealthContentType,
  row: StrapiRow,
  title: string,
  reason: string,
  imageUrl = ""
) {
  const documentId = rowDocumentId(row);
  if (!documentId) return;
  issues.push({
    contentType: type,
    contentTypeLabel: CONTENT_LABEL[type],
    id: displayId(type, row),
    documentId,
    title,
    imageUrl,
    reason,
    editHref: editHref(type, documentId),
  });
}

async function fetchCollection(type: HealthContentType): Promise<StrapiRow[]> {
  const result = await adminStrapiRequest<{ data?: StrapiRow[] }>("GET", QUERIES[type]);
  if (!result.ok) {
    throw new Error(result.error || `读取 ${CONTENT_LABEL[type]} 失败`);
  }
  return result.data?.data ?? [];
}

async function isUrlReachable(url: string, token: string | null): Promise<boolean> {
  if (!url || url === "#") return false;

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    let res = await fetch(url, {
      method: "HEAD",
      headers,
      signal: controller.signal,
      cache: "no-store",
    });

    if (res.ok) return true;
    if (res.status === 404) return false;

    if ([405, 501, 403].includes(res.status)) {
      res = await fetch(url, {
        method: "GET",
        headers: { ...headers, Range: "bytes=0-1023" },
        signal: controller.signal,
        cache: "no-store",
      });
    }

    return res.ok || res.status === 206;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function galleryFirstPath(row: StrapiRow): string {
  const gallery = unwrapStrapiGallery(row.gallery);
  if (!gallery.length) return "";
  return pickMediaPath({ image: gallery[0] });
}

function imageOnlyPath(row: StrapiRow): string {
  return pickMediaPath({ image: row.image });
}

async function checkCases(
  rows: StrapiRow[],
  cmsUrl: string,
  token: string | null
): Promise<HealthIssueRow[]> {
  const issues: HealthIssueRow[] = [];

  for (const row of rows) {
    const titleSource = row as TitleSource;
    const title = pickCaseTitleZh(titleSource);
    const mediaSource: MediaSource = {
      image: row.image,
      cover: row.cover,
      thumbnail: row.thumbnail,
      gallery: unwrapStrapiGallery(row.gallery),
    };
    const { imageUrl, gallery } = mapCaseMediaFields(row, cmsUrl);
    const imagePath = pickMediaPath(mediaSource);
    const listOnlyPath = imageOnlyPath(row);
    const galleryPath = galleryFirstPath(row);

    if (
      !hasText(
        row.titleZh as string,
        row.title as string,
        row.nameZh as string,
        row.name as string
      )
    ) {
      pushIssue(issues, "cases", row, title, "缺少 titleZh / title / nameZh / name", imageUrl);
    }

    if (!imagePath) {
      pushIssue(
        issues,
        "cases",
        row,
        title,
        "缺少 image / cover / thumbnail / gallery[0] 封面",
        imageUrl
      );
      continue;
    }

    if (imageUrl) {
      const reachable = await isUrlReachable(imageUrl, token);
      if (!reachable) {
        pushIssue(issues, "cases", row, title, `imageUrl 无法访问（${imageUrl}）`, imageUrl);
      }
    }

    if (galleryPath) {
      const galleryUrl = resolveAbsoluteUrl(galleryPath, cmsUrl);
      const galleryReachable = await isUrlReachable(galleryUrl, token);
      if (!galleryReachable) {
        pushIssue(
          issues,
          "cases",
          row,
          title,
          `gallery[0] 无法访问（${galleryUrl}）`,
          gallery[0] || galleryUrl
        );
      }
    }

    if (listOnlyPath && galleryPath && listOnlyPath !== galleryPath && imageUrl) {
      const listUrl = resolveAbsoluteUrl(listOnlyPath, cmsUrl);
      const galleryUrl = resolveAbsoluteUrl(galleryPath, cmsUrl);
      if (listUrl !== galleryUrl && galleryUrl !== imageUrl) {
        pushIssue(
          issues,
          "cases",
          row,
          title,
          `列表封面（${listUrl}）与 gallery[0]（${galleryUrl}）不一致，建议统一 image 字段`,
          imageUrl
        );
      }
    }
  }

  return issues;
}

async function checkDownloads(
  rows: StrapiRow[],
  cmsUrl: string,
  token: string | null
): Promise<HealthIssueRow[]> {
  const issues: HealthIssueRow[] = [];
  const missingCoverRows: StrapiRow[] = [];
  const sharedCoverMap = new Map<string, StrapiRow[]>();

  for (const row of rows) {
    const titleSource = row as TitleSource;
    const title = pickDownloadTitleZh(titleSource);
    const mediaSource: MediaSource = {
      image: row.image,
      cover: row.cover,
      thumbnail: row.thumbnail,
    };
    const fileSource = row as DownloadFileSource;
    const imagePath = pickMediaPath(mediaSource);
    const filePath = pickDownloadFilePath(fileSource);
    const imageUrl = imagePath ? resolveAbsoluteUrl(imagePath, cmsUrl) : "";

    if (
      !hasText(
        row.titleZh as string,
        row.title as string,
        row.nameZh as string,
        row.name as string
      )
    ) {
      pushIssue(issues, "downloads", row, title, "缺少 titleZh / title / nameZh / name", imageUrl);
    }

    if (!imagePath) {
      missingCoverRows.push(row);
      pushIssue(issues, "downloads", row, title, "缺少 image / cover 封面", imageUrl);
    } else {
      const reachable = await isUrlReachable(imageUrl, token);
      if (!reachable) {
        pushIssue(issues, "downloads", row, title, `封面 URL 无法访问（${imageUrl}）`, imageUrl);
      }

      const isPlaceholder = SHARED_PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(imageUrl));
      if (isPlaceholder) {
        const bucket = sharedCoverMap.get(imageUrl) ?? [];
        bucket.push(row);
        sharedCoverMap.set(imageUrl, bucket);
      }
    }

    if (!filePath) {
      pushIssue(issues, "downloads", row, title, "缺少 file 下载文件", imageUrl);
    } else {
      const fileUrl = resolveAbsoluteUrl(filePath, cmsUrl);
      const reachable = await isUrlReachable(fileUrl, token);
      if (!reachable) {
        pushIssue(issues, "downloads", row, title, `file.url 无法访问（${fileUrl}）`, imageUrl);
      }
    }
  }

  for (const [url, group] of Array.from(sharedCoverMap.entries())) {
    if (group.length < 2) continue;
    for (const row of group) {
      const title = pickDownloadTitleZh(row as TitleSource);
      pushIssue(
        issues,
        "downloads",
        row,
        title,
        `多条下载资源共用同一张占位封面（${url}），请为每条资源上传独立封面`,
        url
      );
    }
  }

  if (missingCoverRows.length >= 2) {
    for (const row of missingCoverRows) {
      const title = pickDownloadTitleZh(row as TitleSource);
      pushIssue(
        issues,
        "downloads",
        row,
        title,
        `共 ${missingCoverRows.length} 条下载资源缺少封面，前台将显示无图占位`,
        ""
      );
    }
  }

  return issues;
}

async function checkProducts(
  rows: StrapiRow[],
  cmsUrl: string,
  token: string | null
): Promise<HealthIssueRow[]> {
  const issues: HealthIssueRow[] = [];

  for (const row of rows) {
    const titleSource = row as TitleSource & { model?: string | null };
    const title = pickProductNameZh(titleSource);
    const mediaSource: MediaSource = {
      image: row.image,
      cover: row.cover,
      thumbnail: row.thumbnail,
    };
    const imagePath = pickMediaPath(mediaSource);
    const imageUrl = imagePath ? resolveAbsoluteUrl(imagePath, cmsUrl) : "";

    if (
      !hasText(
        row.nameZh as string,
        row.name as string,
        row.titleZh as string,
        row.title as string
      )
    ) {
      pushIssue(issues, "products", row, title, "缺少 nameZh / name / titleZh / title", imageUrl);
    }

    if (!imagePath) {
      pushIssue(issues, "products", row, title, "缺少 image 产品图", imageUrl);
      continue;
    }

    const reachable = await isUrlReachable(imageUrl, token);
    if (!reachable) {
      pushIssue(issues, "products", row, title, `image.url 无法访问（${imageUrl}）`, imageUrl);
    }
  }

  return issues;
}

export async function runCmsHealthCheck(): Promise<HealthCheckResult> {
  const checkedAt = new Date().toISOString();
  const cmsUrl = getCmsUrl();
  const token = process.env.STRAPI_API_TOKEN?.trim() || null;

  if (!token) {
    return {
      ok: false,
      checkedAt,
      summary: {
        cases: { total: 0, issues: 0 },
        downloads: { total: 0, issues: 0 },
        products: { total: 0, issues: 0 },
      },
      issues: [],
      error: "未配置 STRAPI_API_TOKEN，无法读取 Strapi 数据",
    };
  }

  try {
    const [caseRows, downloadRows, productRows] = await Promise.all([
      fetchCollection("cases"),
      fetchCollection("downloads"),
      fetchCollection("products"),
    ]);

    const [caseIssues, downloadIssues, productIssues] = await Promise.all([
      checkCases(caseRows, cmsUrl, token),
      checkDownloads(downloadRows, cmsUrl, token),
      checkProducts(productRows, cmsUrl, token),
    ]);

    const issues = [...caseIssues, ...downloadIssues, ...productIssues];

    return {
      ok: issues.length === 0,
      checkedAt,
      summary: {
        cases: { total: caseRows.length, issues: caseIssues.length },
        downloads: { total: downloadRows.length, issues: downloadIssues.length },
        products: { total: productRows.length, issues: productIssues.length },
      },
      issues,
    };
  } catch (e) {
    return {
      ok: false,
      checkedAt,
      summary: {
        cases: { total: 0, issues: 0 },
        downloads: { total: 0, issues: 0 },
        products: { total: 0, issues: 0 },
      },
      issues: [],
      error: e instanceof Error ? e.message : "健康检查失败",
    };
  }
}
