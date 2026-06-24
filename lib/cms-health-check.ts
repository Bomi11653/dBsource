import { mapCaseMediaFields } from "@/lib/case-media";
import { getSpecSheetForProduct, getStackedSpecPages } from "@/data/product-specs";
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

export type HealthContentType =
  | "cases"
  | "downloads"
  | "products"
  | "contact"
  | "qrCodes"
  | "socialLinks";

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
  contact: { total: number; issues: number };
  qrCodes: { total: number; issues: number };
  socialLinks: { total: number; issues: number };
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
  productLine?: string | null;
  specsZh?: string | null;
  specsEn?: string | null;
  labelZh?: string | null;
  labelEn?: string | null;
  platformKey?: string | null;
  enabled?: boolean | null;
  url?: string | null;
  qrImage?: unknown;
  companyZh?: string | null;
  companyEn?: string | null;
  phones?: string | null;
  email?: string | null;
  addressZh?: string | null;
  addressEn?: string | null;
  mapQuery?: string | null;
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
  contact: "联系我们",
  qrCodes: "页脚二维码",
  socialLinks: "社交链接",
};

const EDIT_SECTION: Record<HealthContentType, string> = {
  cases: "cases",
  downloads: "downloads",
  products: "products",
  contact: "contact",
  qrCodes: "qr",
  socialLinks: "home",
};

const COLLECTION_QUERIES: Record<"cases" | "downloads" | "products", string> = {
  cases: "/cases?populate[image]=true&populate[gallery]=true&sort[0]=legacyId:asc&pagination[pageSize]=100",
  downloads:
    "/downloads?populate[cover]=true&populate[file]=true&sort[0]=sortOrder:asc&pagination[pageSize]=100",
  products: "/products?populate[image]=true&sort[0]=sortOrder:asc&pagination[pageSize]=200",
};

const EMPTY_SUMMARY: HealthCheckSummary = {
  cases: { total: 0, issues: 0 },
  downloads: { total: 0, issues: 0 },
  products: { total: 0, issues: 0 },
  contact: { total: 0, issues: 0 },
  qrCodes: { total: 0, issues: 0 },
  socialLinks: { total: 0, issues: 0 },
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
  if (type === "contact") return "contact-info";
  if (type === "cases" && row.legacyId != null) return String(row.legacyId);
  if (row.sortOrder != null) return String(row.sortOrder);
  return rowDocumentId(row) || "—";
}

function editHref(type: HealthContentType, documentId: string): string {
  if (type === "contact") return `/admin/${EDIT_SECTION.contact}`;
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

async function fetchCollection(type: "cases" | "downloads" | "products"): Promise<StrapiRow[]> {
  const result = await adminStrapiRequest<{ data?: StrapiRow[] }>("GET", COLLECTION_QUERIES[type]);
  if (!result.ok) {
    throw new Error(result.error || `读取 ${CONTENT_LABEL[type]} 失败`);
  }
  return result.data?.data ?? [];
}

async function fetchContactDoc(): Promise<StrapiRow | null> {
  const result = await adminStrapiRequest<{ data?: StrapiRow }>("GET", "/contact-info");
  if (!result.ok) {
    throw new Error(result.error || "读取联系我们失败");
  }
  return result.data?.data ?? null;
}

async function fetchQrCodeRows(): Promise<StrapiRow[]> {
  const result = await adminStrapiRequest<{ data?: StrapiRow[] }>(
    "GET",
    "/qr-codes?populate[image]=true&sort[0]=sortOrder:asc"
  );
  if (!result.ok) {
    throw new Error(result.error || "读取页脚二维码失败");
  }
  return result.data?.data ?? [];
}

async function fetchSocialLinkRows(): Promise<StrapiRow[]> {
  const result = await adminStrapiRequest<{ data?: StrapiRow[] }>(
    "GET",
    "/social-links?populate[qrImage][fields][0]=url&sort[0]=sortOrder:asc"
  );
  if (!result.ok) {
    throw new Error(result.error || "读取社交链接失败");
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
    pushIssue(
      issues,
      "downloads",
      missingCoverRows[0],
      pickDownloadTitleZh(missingCoverRows[0] as TitleSource),
      `共 ${missingCoverRows.length} 条下载资源缺少封面，前台将显示无图占位`,
      ""
    );
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

    const model = String(row.model ?? "").trim();
    const productLine = String(row.productLine ?? "default").trim() || "default";
    const hasCmsSpecs = hasText(row.specsZh, row.specsEn);
    const hasStaticSpecs =
      Boolean(model) &&
      (Boolean(getStackedSpecPages(model)) ||
        Boolean(getSpecSheetForProduct({ model, productLine })));
    if (!hasCmsSpecs && !hasStaticSpecs) {
      pushIssue(
        issues,
        "products",
        row,
        title,
        "缺少 specsZh/specsEn 且无内置参数表，详情页技术规格将为空",
        imageUrl
      );
    }
  }

  return issues;
}

async function checkContact(doc: StrapiRow | null): Promise<HealthIssueRow[]> {
  const issues: HealthIssueRow[] = [];
  const row: StrapiRow = doc ?? { documentId: "contact-info" };
  const title = hasText(row.companyZh) ? String(row.companyZh) : "联系我们";

  if (!doc) {
    pushIssue(issues, "contact", row, title, "Strapi 中未找到 contact-info 单页内容", "");
    return issues;
  }

  if (!hasText(row.companyZh, row.companyEn)) {
    pushIssue(issues, "contact", row, title, "缺少 companyZh / companyEn 公司名称", "");
  }
  if (!hasText(row.phones)) {
    pushIssue(issues, "contact", row, title, "缺少 phones 联系电话", "");
  }
  if (!hasText(row.email)) {
    pushIssue(issues, "contact", row, title, "缺少 email 邮箱", "");
  }
  if (!hasText(row.addressZh, row.addressEn)) {
    pushIssue(issues, "contact", row, title, "缺少 addressZh / addressEn 地址", "");
  }
  if (!hasText(row.mapQuery)) {
    pushIssue(issues, "contact", row, title, "缺少 mapQuery 地图定位关键词", "");
  }

  return issues;
}

async function checkQrCodes(
  rows: StrapiRow[],
  cmsUrl: string,
  token: string | null
): Promise<HealthIssueRow[]> {
  const issues: HealthIssueRow[] = [];

  if (rows.length === 0) {
    const row: StrapiRow = { documentId: "qr-codes" };
    pushIssue(issues, "qrCodes", row, "页脚二维码", "未配置任何 qr-codes 条目，页脚「关注我们」将为空", "");
    return issues;
  }

  for (const row of rows) {
    const title = hasText(row.labelZh, row.labelEn)
      ? String(row.labelZh || row.labelEn)
      : `二维码 #${displayId("qrCodes", row)}`;
    const imagePath = pickMediaPath({ image: row.image });
    const imageUrl = imagePath ? resolveAbsoluteUrl(imagePath, cmsUrl) : "";

    if (!hasText(row.labelZh, row.labelEn)) {
      pushIssue(issues, "qrCodes", row, title, "缺少 labelZh / labelEn 标签", imageUrl);
    }
    if (!imagePath) {
      pushIssue(issues, "qrCodes", row, title, "缺少 image 二维码图片", imageUrl);
      continue;
    }
    const reachable = await isUrlReachable(imageUrl, token);
    if (!reachable) {
      pushIssue(issues, "qrCodes", row, title, `二维码图片无法访问（${imageUrl}）`, imageUrl);
    }
  }

  return issues;
}

async function checkSocialLinks(
  rows: StrapiRow[],
  cmsUrl: string,
  token: string | null
): Promise<HealthIssueRow[]> {
  const issues: HealthIssueRow[] = [];
  const enabled = rows.filter((row) => row.enabled !== false);

  if (enabled.length === 0) {
    const row: StrapiRow = { documentId: "social-links" };
    pushIssue(
      issues,
      "socialLinks",
      row,
      "社交链接",
      "未启用任何 social-links，页脚平台卡片可能无跳转链接",
      ""
    );
    return issues;
  }

  for (const row of enabled) {
    const title = hasText(row.labelZh, row.labelEn)
      ? String(row.labelZh || row.labelEn)
      : String(row.platformKey ?? "social");
    const qrPath = pickMediaPath({ image: row.qrImage });
    const qrUrl = qrPath ? resolveAbsoluteUrl(qrPath, cmsUrl) : "";
    const hasUrl = hasText(row.url);

    if (!hasUrl) {
      pushIssue(
        issues,
        "socialLinks",
        row,
        title,
        `平台 ${row.platformKey ?? "—"} 已启用但缺少 url 跳转链接`,
        qrUrl
      );
    }

    if (!qrPath) {
      pushIssue(
        issues,
        "socialLinks",
        row,
        title,
        `平台 ${row.platformKey ?? "—"} 缺少 qrImage 二维码图片（页脚卡片可能无图）`,
        qrUrl
      );
    } else {
      const reachable = await isUrlReachable(qrUrl, token);
      if (!reachable) {
        pushIssue(
          issues,
          "socialLinks",
          row,
          title,
          `qrImage 无法访问（${qrUrl}）`,
          qrUrl
        );
      }
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
      summary: { ...EMPTY_SUMMARY },
      issues: [],
      error: "未配置 STRAPI_API_TOKEN，无法读取 Strapi 数据",
    };
  }

  try {
    const [caseRows, downloadRows, productRows, contactDoc, qrRows, socialRows] =
      await Promise.all([
        fetchCollection("cases"),
        fetchCollection("downloads"),
        fetchCollection("products"),
        fetchContactDoc(),
        fetchQrCodeRows(),
        fetchSocialLinkRows(),
      ]);

    const [
      caseIssues,
      downloadIssues,
      productIssues,
      contactIssues,
      qrIssues,
      socialIssues,
    ] = await Promise.all([
      checkCases(caseRows, cmsUrl, token),
      checkDownloads(downloadRows, cmsUrl, token),
      checkProducts(productRows, cmsUrl, token),
      checkContact(contactDoc),
      checkQrCodes(qrRows, cmsUrl, token),
      checkSocialLinks(socialRows, cmsUrl, token),
    ]);

    const issues = [
      ...caseIssues,
      ...downloadIssues,
      ...productIssues,
      ...contactIssues,
      ...qrIssues,
      ...socialIssues,
    ];

    return {
      ok: issues.length === 0,
      checkedAt,
      summary: {
        cases: { total: caseRows.length, issues: caseIssues.length },
        downloads: { total: downloadRows.length, issues: downloadIssues.length },
        products: { total: productRows.length, issues: productIssues.length },
        contact: { total: contactDoc ? 1 : 0, issues: contactIssues.length },
        qrCodes: { total: qrRows.length, issues: qrIssues.length },
        socialLinks: { total: socialRows.length, issues: socialIssues.length },
      },
      issues,
    };
  } catch (e) {
    return {
      ok: false,
      checkedAt,
      summary: { ...EMPTY_SUMMARY },
      issues: [],
      error: e instanceof Error ? e.message : "健康检查失败",
    };
  }
}
