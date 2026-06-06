import type { DownloadItem, Locale } from "@/data/mock";

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
