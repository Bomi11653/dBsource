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

export const PRESET_DOWNLOAD_SUB_SLUGS = new Set<string>(
  DOWNLOAD_SUB_CATEGORIES.map((d) => d.slug)
);

export const DOWNLOAD_SUB_CATEGORY_CUSTOM_PRESET = "__custom__";

export function isPresetDownloadSubCategory(
  slug: string
): slug is DownloadSubCategorySlug {
  return PRESET_DOWNLOAD_SUB_SLUGS.has(slug);
}

/** 将后台自定义输入规范为 slug（小写、连字符） */
export function normalizeDownloadSubCategorySlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[·•|/\\]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** 保存时：自定义优先，否则用下拉预设 */
export function resolveDownloadSubCategoryForSave(
  customInput: string,
  presetSelect: string,
  existing?: string
): string {
  const normalized = normalizeDownloadSubCategorySlug(customInput);
  if (normalized) return normalized;

  const preset = presetSelect.trim();
  if (preset && preset !== DOWNLOAD_SUB_CATEGORY_CUSTOM_PRESET) {
    return isPresetDownloadSubCategory(preset) ? preset : normalizeDownloadSubCategorySlug(preset) || preset;
  }

  const prior = existing?.trim();
  if (prior) return prior;
  return "v225a";
}

/** 从 Strapi 子分类值初始化后台草稿（预设 / 自定义回显） */
export function initDownloadSubCategoryDraftFields(stored: string): {
  subCategory: string;
  subCategoryPreset: string;
  subCategoryCustom: string;
} {
  const value = stored.trim();
  if (value && !isPresetDownloadSubCategory(value)) {
    return {
      subCategory: value,
      subCategoryPreset: DOWNLOAD_SUB_CATEGORY_CUSTOM_PRESET,
      subCategoryCustom: value,
    };
  }
  return {
    subCategory: value || "v225a",
    subCategoryPreset: value || "v225a",
    subCategoryCustom: "",
  };
}

/** 前台展示未知子分类 slug */
export function formatDownloadSubCategorySlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getDownloadSubCategoryDisplayLabel(slug: string, locale: Locale): string {
  const preset = getDownloadSubCategoryBySlug(slug);
  if (preset) return preset.label[locale];
  return formatDownloadSubCategorySlug(slug);
}

/** 当前 Tab 下实际出现的子分类：预设（保持原序）+ 自定义（字母序） */
export function mergeDownloadSubCategoriesForItems(
  items: DownloadItem[],
  tab: DownloadTab
): Array<{ slug: string; label: { zh: string; en: string } }> {
  const tabItems = items.filter((d) => d.type === tab);
  const seen = new Set<string>();
  const result: Array<{ slug: string; label: { zh: string; en: string } }> = [];

  for (const preset of getDownloadSubCategoriesForTab(tab)) {
    if (tabItems.some((item) => item.subCategory === preset.slug)) {
      result.push({ slug: preset.slug, label: preset.label });
      seen.add(preset.slug);
    }
  }

  const customSlugs = Array.from(
    new Set(
      tabItems
        .map((item) => item.subCategory?.trim())
        .filter((slug): slug is string => Boolean(slug && !seen.has(slug)))
    )
  ).sort();

  for (const slug of customSlugs) {
    result.push({
      slug,
      label: {
        zh: getDownloadSubCategoryDisplayLabel(slug, "zh"),
        en: getDownloadSubCategoryDisplayLabel(slug, "en"),
      },
    });
  }

  return result;
}

export function downloadSubCategoryLabel(sub: DownloadSubCategory, locale: Locale): string {
  return sub.label[locale];
}

export function filterDownloads(
  list: DownloadItem[],
  tab?: DownloadTab | null,
  subSlug?: string | null
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
