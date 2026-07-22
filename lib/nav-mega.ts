import type { CaseItem, CaseType, DownloadItem, Locale, Product } from "@/data/mock";
import { CASE_TYPES, getCaseMegaLinks } from "@/lib/cases";
import {
  DOWNLOAD_TABS,
  getDownloadMegaLinks,
  type DownloadTab,
} from "@/lib/downloads";
import {
  getEngineeringSeriesLabel,
  getEngineeringSeriesNavItems,
  getProductCategoryLabel,
  getTouringProductLabel,
  getTouringProductNavItems,
  type EngineeringSeriesNavItem,
  type ProductCategoryType,
  type TouringProductNavItem,
} from "@/lib/product-classification";
import type { ProductSeriesConfig } from "@/lib/product-series-config";
import { DEFAULT_PRODUCT_SERIES_CONFIG } from "@/lib/product-series-config";

/** PC 悬停大菜单 + 手机抽屉共用的菜单 key */
export type NavMegaMenuKey = "products" | "cases" | "downloads";

export type MegaLinkItem = {
  key: string;
  href: string;
  label: string;
};

/** 大菜单 / 手机抽屉统一视觉类名（Step 2 起手机端逐步对齐） */
export const NAV_MEGA_STYLES = {
  panelRow: "flex gap-12 md:gap-16 lg:gap-20 items-stretch w-full",
  panelShell:
    "hidden lg:block absolute left-0 right-0 top-full border-t border-white/10 bg-[#1d1d1f]/95 backdrop-blur-2xl",
  exploreEyebrow: "text-[11px] text-gray-500 mb-4 tracking-wide",
  categoryActive:
    "block w-full text-left py-1 text-xl md:text-2xl font-semibold tracking-tight transition-colors text-white",
  categoryInactive:
    "block w-full text-left py-1 text-xl md:text-2xl font-semibold tracking-tight transition-colors text-gray-400 hover:text-white",
  categoryLinkActive:
    "block py-1 text-xl md:text-2xl font-semibold tracking-tight transition-colors text-white",
  categoryLinkInactive:
    "block py-1 text-xl md:text-2xl font-semibold tracking-tight transition-colors text-gray-400 hover:text-white",
  subLink:
    "block py-1.5 text-base md:text-lg text-gray-300 hover:text-white transition-colors",
  subLinkCases:
    "block py-1.5 text-base md:text-lg text-gray-300 hover:text-white transition-colors whitespace-normal break-words leading-snug",
  viewAll: "mt-auto pt-10 text-sm text-gray-500 hover:text-white transition-colors",
  mobileDrawer:
    "lg:hidden relative z-50 overflow-hidden border-t border-white/10 bg-[#1d1d1f]/95 backdrop-blur-2xl",
  mobileNavTopLink:
    "flex items-center min-h-[44px] py-2 text-base font-medium text-white touch-active transition-colors",
  mobileNavSectionTrigger:
    "flex-1 flex items-center min-h-[44px] py-2 text-base font-semibold tracking-tight text-white touch-active",
  mobileSubpanel:
    "mx-1 mb-2 rounded-xl border border-white/10 bg-black/20 overflow-hidden",
  mobileSubpanelInner: "px-3 py-3 space-y-4",
  mobileCategoryHeading:
    "block py-1 text-xl font-semibold tracking-tight text-white",
  mobileCategoryLink:
    "flex items-center min-h-[44px] py-1 text-xl font-semibold tracking-tight text-gray-300 hover:text-white touch-active transition-colors",
  mobileSubLinkList: "space-y-0.5 border-l border-white/10 ml-2 pl-3",
  mobileSubLink:
    "flex items-center min-h-[44px] py-2 text-base text-gray-300 hover:text-white touch-active transition-colors leading-snug break-words",
  mobileViewAll:
    "flex items-center min-h-[44px] pt-3 mt-1 border-t border-white/10 text-sm text-gray-500 hover:text-white touch-active transition-colors",
} as const;

export type NavMegaCategoryGroup = {
  key: string;
  label: string;
  /** 分类标题可点击跳转（案例 / 下载 Tab） */
  href?: string;
  links: MegaLinkItem[];
};

export type NavMegaSectionData = {
  key: NavMegaMenuKey;
  href: string;
  label: string;
  exploreLabel: string;
  viewAllHref: string;
  viewAllLabel: string;
  categories: NavMegaCategoryGroup[];
};

export type NavMegaCatalogLabels = {
  explore: string;
  viewAllProducts: string;
  viewAllCases: string;
  viewAllDownloads: string;
  products: string;
  cases: string;
  downloads: string;
  home: string;
  about: string;
  casesEngineering: string;
  casesPerformance: string;
  downloadsSoftware: string;
  downloadsCatalog: string;
};

export function splitIntoMegaColumns(
  items: MegaLinkItem[],
  firstColumnCount: number,
  restColumnSize = 3
): MegaLinkItem[][] {
  if (items.length <= firstColumnCount) return [items];
  const columns: MegaLinkItem[][] = [items.slice(0, firstColumnCount)];
  const rest = items.slice(firstColumnCount);
  for (let i = 0; i < rest.length; i += restColumnSize) {
    columns.push(rest.slice(i, i + restColumnSize));
  }
  return columns;
}

export function getNavMegaCatalogLabels(t: {
  nav: {
    megaExplore: string;
    megaViewAll: string;
    megaViewAllCases: string;
    megaViewAllDownloads: string;
    products: string;
    cases: string;
    downloads: string;
    home: string;
    about: string;
    casesEngineering: string;
    casesPerformance: string;
  };
  downloads: { software: string; catalog: string };
}): NavMegaCatalogLabels {
  return {
    explore: t.nav.megaExplore,
    viewAllProducts: t.nav.megaViewAll,
    viewAllCases: t.nav.megaViewAllCases,
    viewAllDownloads: t.nav.megaViewAllDownloads,
    products: t.nav.products,
    cases: t.nav.cases,
    downloads: t.nav.downloads,
    home: t.nav.home,
    about: t.nav.about,
    casesEngineering: t.nav.casesEngineering,
    casesPerformance: t.nav.casesPerformance,
    downloadsSoftware: t.downloads.software,
    downloadsCatalog: t.downloads.catalog,
  };
}

export function getCaseTypeLabels(labels: NavMegaCatalogLabels): Record<CaseType, string> {
  return {
    engineering: labels.casesEngineering,
    performance: labels.casesPerformance,
  };
}

export function getDownloadTabLabels(
  labels: NavMegaCatalogLabels
): Record<DownloadTab, string> {
  return {
    software: labels.downloadsSoftware,
    catalog: labels.downloadsCatalog,
  };
}

export function buildProductsMegaSection(
  locale: Locale,
  labels: NavMegaCatalogLabels,
  engineeringItems: EngineeringSeriesNavItem[],
  touringItems: TouringProductNavItem[]
): NavMegaSectionData {
  return {
    key: "products",
    href: "/products",
    label: labels.products,
    exploreLabel: labels.explore,
    viewAllHref: "/products",
    viewAllLabel: labels.viewAllProducts,
    categories: [
      {
        key: "engineering",
        label: getProductCategoryLabel("engineering", locale),
        links: engineeringItems.map((item) => ({
          key: item.key,
          href: item.href,
          label: getEngineeringSeriesLabel(item, locale),
        })),
      },
      {
        key: "touring",
        label: getProductCategoryLabel("touring", locale),
        links: touringItems.map((item) => ({
          key: item.key,
          href: item.href,
          label: getTouringProductLabel(item, locale),
        })),
      },
    ],
  };
}

export function buildCasesMegaSection(
  locale: Locale,
  labels: NavMegaCatalogLabels,
  cases: CaseItem[]
): NavMegaSectionData {
  const caseLabels = getCaseTypeLabels(labels);
  return {
    key: "cases",
    href: "/cases",
    label: labels.cases,
    exploreLabel: labels.explore,
    viewAllHref: "/cases",
    viewAllLabel: labels.viewAllCases,
    categories: CASE_TYPES.map((type) => ({
      key: type,
      label: caseLabels[type],
      href: `/cases?type=${type}`,
      links: getCaseMegaLinks(type, locale, cases),
    })),
  };
}

export function buildDownloadsMegaSection(
  locale: Locale,
  labels: NavMegaCatalogLabels,
  downloads: DownloadItem[]
): NavMegaSectionData {
  const tabLabels = getDownloadTabLabels(labels);
  return {
    key: "downloads",
    href: "/downloads",
    label: labels.downloads,
    exploreLabel: labels.explore,
    viewAllHref: "/downloads",
    viewAllLabel: labels.viewAllDownloads,
    categories: DOWNLOAD_TABS.map((tab) => ({
      key: tab,
      label: tabLabels[tab],
      href: `/downloads?tab=${tab}`,
      links: getDownloadMegaLinks(tab, locale, downloads),
    })),
  };
}

export function buildNavMegaSections(input: {
  locale: Locale;
  labels: NavMegaCatalogLabels;
  products: Product[];
  cases: CaseItem[];
  downloads: DownloadItem[];
  productSeriesConfig?: ProductSeriesConfig;
}): Record<NavMegaMenuKey, NavMegaSectionData> {
  const config = input.productSeriesConfig ?? DEFAULT_PRODUCT_SERIES_CONFIG;
  const engineeringItems = getEngineeringSeriesNavItems(input.products, { config });
  const touringItems = getTouringProductNavItems(input.products, config).items;

  return {
    products: buildProductsMegaSection(
      input.locale,
      input.labels,
      engineeringItems,
      touringItems
    ),
    cases: buildCasesMegaSection(input.locale, input.labels, input.cases),
    downloads: buildDownloadsMegaSection(input.locale, input.labels, input.downloads),
  };
}

export function getProductMegaSubLinks(
  section: NavMegaSectionData,
  activeCategory: ProductCategoryType
): MegaLinkItem[] {
  return (
    section.categories.find((group) => group.key === activeCategory)?.links ?? []
  );
}

export function getCasesMegaSubLinks(
  section: NavMegaSectionData,
  activeType: CaseType
): MegaLinkItem[] {
  return section.categories.find((group) => group.key === activeType)?.links ?? [];
}

export function getDownloadsMegaSubLinks(
  section: NavMegaSectionData,
  activeTab: DownloadTab
): MegaLinkItem[] {
  return section.categories.find((group) => group.key === activeTab)?.links ?? [];
}

export const PRODUCT_MEGA_CATEGORIES: ProductCategoryType[] = ["engineering", "touring"];
