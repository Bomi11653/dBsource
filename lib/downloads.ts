import type { DownloadItem, Locale } from "@/data/mock";
import { downloads as downloadCatalog } from "@/data/mock";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";

export type DownloadTab = "software" | "catalog";

export type DownloadSubCategorySlug =
  | "v225a"
  | "dbcover-mac"
  | "dbcover-win"
  | "unit48"
  | "soloc"
  | "preset-pack"
  | "sol12sa"
  | "v415a"
  | "catalog-cn"
  | "catalog-en"
  | "case-study";

export interface DownloadSubCategory {
  slug: DownloadSubCategorySlug;
  tab: DownloadTab;
  label: { zh: string; en: string };
}

export const DOWNLOAD_TABS: DownloadTab[] = ["software", "catalog"];

/** 各 Tab 在导航与列表中的固定顺序 */
export const DOWNLOAD_TAB_ORDER: Record<DownloadTab, number[]> = {
  software: [1, 2, 3, 4, 5, 6, 7, 8],
  catalog: [9, 10, 11],
};

export const DOWNLOAD_SUB_CATEGORIES: DownloadSubCategory[] = [
  { slug: "v225a", tab: "software", label: { zh: "V225A", en: "V225A" } },
  {
    slug: "dbcover-mac",
    tab: "software",
    label: { zh: "dBcover Mac", en: "dBcover Mac" },
  },
  {
    slug: "dbcover-win",
    tab: "software",
    label: { zh: "dBcover Windows", en: "dBcover Windows" },
  },
  {
    slug: "unit48",
    tab: "software",
    label: { zh: "Unit48 软件", en: "Unit48 Software" },
  },
  { slug: "soloc", tab: "software", label: { zh: "SOLOC", en: "SOLOC" } },
  {
    slug: "preset-pack",
    tab: "software",
    label: { zh: "预设包", en: "Preset Pack" },
  },
  { slug: "sol12sa", tab: "software", label: { zh: "SOL12SA", en: "SOL12SA" } },
  {
    slug: "v415a",
    tab: "software",
    label: { zh: "V415A 功放", en: "V415A Amp" },
  },
  {
    slug: "catalog-cn",
    tab: "catalog",
    label: { zh: "产品画册（中文）", en: "Catalog (CN)" },
  },
  {
    slug: "catalog-en",
    tab: "catalog",
    label: { zh: "产品画册（英文）", en: "Catalog (EN)" },
  },
  {
    slug: "case-study",
    tab: "catalog",
    label: { zh: "工程案例集", en: "Case Studies" },
  },
];

export function getDownloadSubCategoriesForTab(tab: DownloadTab): DownloadSubCategory[] {
  return DOWNLOAD_SUB_CATEGORIES.filter((d) => d.tab === tab);
}

/** 导航子项：按 Tab 列出具体下载文件（与工程案例子目录逻辑一致） */
export function getDownloadsForTab(
  tab: DownloadTab,
  list: DownloadItem[] = downloadCatalog
): DownloadItem[] {
  const order = DOWNLOAD_TAB_ORDER[tab];
  const byId = new Map(list.filter((d) => d.type === tab).map((d) => [d.id, d]));
  return order.map((id) => byId.get(id)).filter((d): d is DownloadItem => Boolean(d));
}

export function getDownloadMegaLinks(
  tab: DownloadTab,
  locale: Locale,
  list?: DownloadItem[]
): { key: string; href: string; label: string }[] {
  const source = list?.length ? list : downloadCatalog;
  return getDownloadsForTab(tab, source).map((d) => ({
    key: String(d.id),
    href: `/downloads?tab=${d.type}&file=${d.id}`,
    label: d.name[locale],
  }));
}

export function getDownloadSubCategoryBySlug(slug: string): DownloadSubCategory | undefined {
  return DOWNLOAD_SUB_CATEGORIES.find((d) => d.slug === slug);
}

export function downloadSubCategoryLabel(sub: DownloadSubCategory, locale: Locale): string {
  return sub.label[locale];
}

export function filterDownloads(
  list: DownloadItem[],
  tab?: DownloadTab | null,
  subSlug?: DownloadSubCategorySlug | null
): DownloadItem[] {
  let result = list;
  if (tab) {
    result = result.filter((d) => d.type === tab);
  }
  if (subSlug) {
    result = result.filter((d) => d.subCategory === subSlug);
  }
  return result;
}

/** 资源分享链接：进入下载页、定位卡片并自动触发下载 */
export function buildDownloadShareUrl(file: DownloadItem, origin: string): string {
  const base = origin.replace(/\/$/, "");
  const params = new URLSearchParams();
  params.set("tab", file.type);
  params.set("download", String(file.id));
  return `${base}/downloads?${params.toString()}#download-${file.id}`;
}

/** 公开文件下载 API 路径（站内下载按钮与自动下载共用） */
export function getDownloadFileApiPath(id: number): string {
  return `/api/downloads/${id}/file`;
}

/** 从分享链接 query 解析资源 ID（兼容旧 file 参数） */
export function parseDownloadShareTargetId(searchParams: URLSearchParams): number | null {
  const fromDownload = Number(searchParams.get("download"));
  if (Number.isFinite(fromDownload)) return fromDownload;
  const fromFile = Number(searchParams.get("file"));
  if (Number.isFinite(fromFile)) return fromFile;
  return null;
}

/** 下载页定位链接（站内跳转、高亮资源） */
export function buildDownloadPageUrl(file: DownloadItem, origin: string): string {
  return buildDownloadShareUrl(file, origin);
}

export type ShareDownloadResult = "shared" | "copied" | "cancelled" | "failed";

/** 仅手机非微信浏览器尝试系统分享；桌面端与微信直接复制链接。 */
export function canUseNativeShare(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("micromessenger")) return false;

  const isMobile = /iphone|ipad|ipod|android|mobile/i.test(navigator.userAgent);
  if (!isMobile) return false;

  return typeof navigator.share === "function" && window.isSecureContext;
}

/** 手机端优先 navigator.share；桌面端与微信直接复制页面分享链接。 */
export async function shareDownloadResource(options: {
  file: DownloadItem;
  title: string;
  text: string;
  origin: string;
}): Promise<ShareDownloadResult> {
  const shareUrl = buildDownloadShareUrl(options.file, options.origin);
  const shareData = {
    title: options.title,
    text: options.text || options.title,
    url: shareUrl,
  };

  if (canUseNativeShare()) {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  const copied = await copyTextToClipboard(shareUrl);
  return copied ? "copied" : "failed";
}
