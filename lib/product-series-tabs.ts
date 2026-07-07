/** 产品型号系列 Tab（后台 /admin/products 与前台 /products 共用） */
export type ProductSeriesTabFilter =
  | "all"
  | "sol"
  | "la"
  | "lw"
  | "mi"
  | "do"
  | "k"
  | "re"
  | "c"
  | "electronics"
  | "software"
  | "other";

export interface ProductSeriesTabRow {
  model?: unknown;
  productLine?: unknown;
  category?: unknown;
  seriesGroup?: unknown;
  sortOrder?: unknown;
}

export const PRODUCT_SERIES_TAB_ORDER: ProductSeriesTabFilter[] = [
  "all",
  "sol",
  "la",
  "lw",
  "mi",
  "do",
  "k",
  "re",
  "c",
  "electronics",
  "software",
  "other",
];

const TAB_LABELS: Record<ProductSeriesTabFilter, string> = {
  all: "全部",
  sol: "SOL系列",
  la: "LA系列",
  lw: "LW系列",
  mi: "MI系列",
  do: "DO系列",
  k: "K系列",
  re: "RE系列",
  c: "C端系列",
  electronics: "电子周边",
  software: "软件",
  other: "其他",
};

const LINE_TO_TAB: Record<string, ProductSeriesTabFilter> = {
  sol: "sol",
  la: "la",
  lw: "lw",
  mi: "mi",
  do: "do",
  k: "k",
  re: "re",
  c: "c",
};

const MODEL_PREFIX_RULES: { prefix: string; tab: ProductSeriesTabFilter }[] = [
  { prefix: "SOL", tab: "sol" },
  { prefix: "LA", tab: "la" },
  { prefix: "LW", tab: "lw" },
  { prefix: "MI", tab: "mi" },
  { prefix: "DO", tab: "do" },
  { prefix: "K", tab: "k" },
  { prefix: "RE", tab: "re" },
  { prefix: "C", tab: "c" },
];

const TAB_WEIGHT = new Map(PRODUCT_SERIES_TAB_ORDER.map((id, index) => [id, index]));

const PRODUCT_SERIES_TAB_ID_SET = new Set<string>(PRODUCT_SERIES_TAB_ORDER);

export const PRODUCT_SERIES_TABS = PRODUCT_SERIES_TAB_ORDER.map((id) => ({
  id,
  label: TAB_LABELS[id],
}));

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
export function getProductSeriesTab(row: ProductSeriesTabRow): ProductSeriesTabFilter {
  const line = strField(row, "productLine").toLowerCase();
  const model = strField(row, "model");

  if (line && LINE_TO_TAB[line]) return LINE_TO_TAB[line];
  if (isSoftware(row)) return "software";
  if (isElectronics(row)) return "electronics";

  const byPrefix = matchModelPrefix(model);
  if (byPrefix) return byPrefix;

  return "other";
}

export function matchProductSeriesTab(
  row: ProductSeriesTabRow,
  filter: ProductSeriesTabFilter
): boolean {
  if (filter === "all") return true;
  return getProductSeriesTab(row) === filter;
}

export function isProductSeriesTab(value: string): value is ProductSeriesTabFilter {
  return PRODUCT_SERIES_TAB_ID_SET.has(value);
}

/** 解析 URL 参数（兼容旧版 series=speaker&sub=la 等链接） */
export function parseProductSeriesTabFromParams(
  series: string | null,
  sub: string | null,
  category: string | null
): ProductSeriesTabFilter {
  if (sub && isProductSeriesTab(sub)) return sub;
  if (series && isProductSeriesTab(series)) return series;

  if (sub) {
    const subLine = sub.toLowerCase();
    if (LINE_TO_TAB[subLine]) return LINE_TO_TAB[subLine];
    if (["electronics", "accessory", "driver", "unit48"].includes(subLine)) return "electronics";
    if (subLine === "suite") return "software";
  }

  if (series === "software" || category === "software") return "software";
  if (series === "dsp" || category === "dsp") return "electronics";

  return "all";
}

export function getProductSeriesTabLabel(filter: ProductSeriesTabFilter): string {
  return TAB_LABELS[filter] ?? filter;
}

export function countProductsBySeriesTab(
  rows: ProductSeriesTabRow[]
): Record<ProductSeriesTabFilter, number> {
  const counts = Object.fromEntries(
    PRODUCT_SERIES_TAB_ORDER.map((id) => [id, 0])
  ) as Record<ProductSeriesTabFilter, number>;

  counts.all = rows.length;

  for (const row of rows) {
    const tab = getProductSeriesTab(row);
    counts[tab] += 1;
  }

  return counts;
}

function compareModelNatural(a: string, b: string): number {
  return a.localeCompare(b, "zh-Hans-CN", { numeric: true, sensitivity: "base" });
}

export function compareProductsBySeriesTab(
  a: ProductSeriesTabRow,
  b: ProductSeriesTabRow
): number {
  const orderA = Number(a.sortOrder) || 0;
  const orderB = Number(b.sortOrder) || 0;
  if (orderA !== orderB) return orderA - orderB;

  const tabA = TAB_WEIGHT.get(getProductSeriesTab(a)) ?? 999;
  const tabB = TAB_WEIGHT.get(getProductSeriesTab(b)) ?? 999;
  if (tabA !== tabB) return tabA - tabB;

  return compareModelNatural(strField(a, "model"), strField(b, "model"));
}

export function filterProductsBySeriesTab<T extends ProductSeriesTabRow>(
  list: T[],
  filter: ProductSeriesTabFilter
): T[] {
  const filtered =
    filter === "all" ? list : list.filter((item) => matchProductSeriesTab(item, filter));
  return [...filtered].sort(compareProductsBySeriesTab);
}
