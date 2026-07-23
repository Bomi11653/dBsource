/** 产品型号系列 Tab（后台 /admin/products 与前台 /products 共用） */
import {
  DEFAULT_PRODUCT_SERIES_CONFIG,
  getEngineeringSeriesOrder,
  getUnifiedEngineeringSeriesEntries,
  type ProductSeriesConfig,
} from "@/lib/product-series-config";

export type ProductSeriesTabFilter =
  | "all"
  | "sol"
  | "la"
  | "lw"
  | "mi"
  | "do"
  | "k"
  | "re"
  | "electronics"
  | "other";

export interface ProductSeriesTabRow {
  model?: unknown;
  productLine?: unknown;
  category?: unknown;
  seriesGroup?: unknown;
  sortOrder?: unknown;
  /** 前台 Product.id 即 Strapi sortOrder */
  id?: unknown;
}

function buildEngineeringTabMeta(config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG) {
  const unified = getUnifiedEngineeringSeriesEntries(config).filter((entry) => entry.visible);
  const fullOrder = getEngineeringSeriesOrder(config);
  const tabOrder: ProductSeriesTabFilter[] = [
    "all",
    ...unified.map((entry) => entry.key as ProductSeriesTabFilter),
    "other",
  ];
  const tabLabels = {
    all: "全部",
    other: "其他",
    electronics: "电子产品",
  } as Record<ProductSeriesTabFilter, string>;
  for (const entry of getUnifiedEngineeringSeriesEntries(config)) {
    tabLabels[entry.key as ProductSeriesTabFilter] = entry.labelZh;
  }
  for (const entry of fullOrder) {
    if (entry.key === "electronics") {
      tabLabels.electronics = entry.labelZh || "电子产品";
    }
  }
  const lineToTab: Record<string, ProductSeriesTabFilter> = {};
  for (const entry of fullOrder) {
    lineToTab[entry.key] = entry.key as ProductSeriesTabFilter;
  }
  return { tabOrder, tabLabels, lineToTab };
}

const DEFAULT_TAB_META = buildEngineeringTabMeta();

export const PRODUCT_SERIES_TAB_ORDER = DEFAULT_TAB_META.tabOrder;

const TAB_LABELS = DEFAULT_TAB_META.tabLabels;
const LINE_TO_TAB = DEFAULT_TAB_META.lineToTab;

const MODEL_PREFIX_RULES: { prefix: string; tab: ProductSeriesTabFilter }[] = [
  { prefix: "SOL", tab: "sol" },
  { prefix: "LA", tab: "la" },
  { prefix: "LW", tab: "lw" },
  { prefix: "MI", tab: "mi" },
  { prefix: "DO", tab: "do" },
  { prefix: "K", tab: "k" },
  { prefix: "RE", tab: "re" },
];

const TAB_WEIGHT = new Map(PRODUCT_SERIES_TAB_ORDER.map((id, index) => [id, index]));

const PRODUCT_SERIES_TAB_ID_SET = new Set<string>(PRODUCT_SERIES_TAB_ORDER);

export const PRODUCT_SERIES_TABS = PRODUCT_SERIES_TAB_ORDER.map((id) => ({
  id,
  label: TAB_LABELS[id],
}));

export function getProductSeriesTabs(config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG) {
  const meta = buildEngineeringTabMeta(config);
  return meta.tabOrder.map((id) => ({
    id,
    label: meta.tabLabels[id],
  }));
}

function strField(row: ProductSeriesTabRow, key: string): string {
  const value = (row as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

function matchModelPrefix(model: string): ProductSeriesTabFilter | null {
  const upper = model.toUpperCase();
  for (const rule of MODEL_PREFIX_RULES) {
    if (upper.startsWith(rule.prefix)) return rule.tab;
  }
  return null;
}

function isElectronics(row: ProductSeriesTabRow): boolean {
  const line = strField(row, "productLine").toLowerCase();
  if (["electronics", "accessory", "driver", "unit48"].includes(line)) return true;
  if (strField(row, "category") === "dsp") return true;
  if (strField(row, "seriesGroup") === "dsp") return true;
  return false;
}

function isSoftware(row: ProductSeriesTabRow): boolean {
  const line = strField(row, "productLine").toLowerCase();
  if (line === "suite") return true;
  return strField(row, "category") === "software";
}

/** 返回产品所属型号系列 Tab（互斥） */
export function getProductSeriesTab(
  row: ProductSeriesTabRow,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): ProductSeriesTabFilter {
  const meta = buildEngineeringTabMeta(config);
  const line = strField(row, "productLine").toLowerCase();
  const model = strField(row, "model");

  if (line && meta.lineToTab[line]) return meta.lineToTab[line];
  if (line === "c") return "other";
  if (isSoftware(row)) return "other";
  if (isElectronics(row)) return "electronics";

  const byPrefix = matchModelPrefix(model);
  if (byPrefix) return byPrefix;

  return "other";
}

export function matchProductSeriesTab(
  row: ProductSeriesTabRow,
  filter: ProductSeriesTabFilter,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): boolean {
  if (filter === "all") return true;
  return getProductSeriesTab(row, config) === filter;
}

export function isProductSeriesTab(value: string): value is ProductSeriesTabFilter {
  return PRODUCT_SERIES_TAB_ID_SET.has(value);
}

/** Sub-series / legacy group slug → canonical `series` query param */
const CANONICAL_SERIES_QUERY: Record<string, ProductSeriesTabFilter | "all"> = {
  speaker: "all",
  engineering: "all",
  dsp: "electronics",
  la: "la",
  lw: "lw",
  mi: "mi",
  do: "do",
  sol: "sol",
  k: "k",
  re: "re",
  electronics: "electronics",
  accessory: "electronics",
  unit48: "electronics",
  driver: "electronics",
  suite: "all",
  tour: "other",
  p: "other",
  turnkey: "other",
};

/** Build canonical /products series URL (new format). */
export function getProductSeriesHref(slugOrGroup: string): string {
  const key = slugOrGroup.trim().toLowerCase();
  const resolved =
    CANONICAL_SERIES_QUERY[key] ?? (isProductSeriesTab(key) ? key : null);
  if (!resolved || resolved === "all") return "/products";
  return `/products?series=${resolved}`;
}

/** 解析 URL 参数（兼容旧版 series=speaker&sub=la 等链接） */
export function parseProductSeriesTabFromParams(
  series: string | null,
  sub: string | null,
  category: string | null,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): ProductSeriesTabFilter {
  const meta = buildEngineeringTabMeta(config);
  const visibleTabs = new Set(meta.tabOrder);

  if (sub && isProductSeriesTab(sub) && visibleTabs.has(sub)) return sub;
  if (series && isProductSeriesTab(series) && visibleTabs.has(series)) return series;

  if (sub) {
    const subLine = sub.toLowerCase();
    if (meta.lineToTab[subLine] && visibleTabs.has(meta.lineToTab[subLine])) {
      return meta.lineToTab[subLine];
    }
    if (["electronics", "accessory", "driver", "unit48"].includes(subLine)) return "electronics";
    if (subLine === "suite") return "all";
  }

  if (series === "software" || category === "software") return "all";
  if (series === "c") return "all";
  if (series === "dsp" || category === "dsp") return "electronics";

  return "all";
}

export function getProductSeriesTabLabel(
  filter: ProductSeriesTabFilter,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): string {
  const meta = buildEngineeringTabMeta(config);
  return meta.tabLabels[filter] ?? filter;
}

export function countProductsBySeriesTab(
  rows: ProductSeriesTabRow[],
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): Record<ProductSeriesTabFilter, number> {
  const meta = buildEngineeringTabMeta(config);
  const counts = Object.fromEntries(
    meta.tabOrder.map((id) => [id, 0])
  ) as Record<ProductSeriesTabFilter, number>;

  counts.all = rows.length;

  for (const row of rows) {
    const tab = getProductSeriesTab(row, config);
    counts[tab] += 1;
  }

  return counts;
}

function compareModelNatural(a: string, b: string): number {
  return a.localeCompare(b, "zh-Hans-CN", { numeric: true, sensitivity: "base" });
}

export function compareProductsBySeriesTab(
  a: ProductSeriesTabRow,
  b: ProductSeriesTabRow,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): number {
  const orderA = Number(a.sortOrder ?? a.id) || 0;
  const orderB = Number(b.sortOrder ?? b.id) || 0;
  if (orderA !== orderB) return orderA - orderB;

  const meta = buildEngineeringTabMeta(config);
  const tabWeight = new Map(meta.tabOrder.map((id, index) => [id, index]));
  const tabA = tabWeight.get(getProductSeriesTab(a, config)) ?? 999;
  const tabB = tabWeight.get(getProductSeriesTab(b, config)) ?? 999;
  if (tabA !== tabB) return tabA - tabB;

  return compareModelNatural(strField(a, "model"), strField(b, "model"));
}

export function filterProductsBySeriesTab<T extends ProductSeriesTabRow>(
  list: T[],
  filter: ProductSeriesTabFilter,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): T[] {
  const filtered =
    filter === "all" ? list : list.filter((item) => matchProductSeriesTab(item, filter, config));
  return [...filtered].sort((a, b) => compareProductsBySeriesTab(a, b, config));
}
