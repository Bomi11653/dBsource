import {
  DEFAULT_PRODUCT_SERIES_CONFIG,
  encodeAdminSeriesSelectValue,
  getAdminProductSeriesPatch,
  getAdminProductSeriesSelectOptions,
  getAdminProductSeriesSelectValue,
  getAdminSeriesGroupedSelectOptions,
  getAdminSeriesPatch,
  getEngineeringSeriesOrder,
  getSeriesBadge,
  isProductSeriesDisplayKey,
  parseAdminSeriesSelectValue,
  resolveAdminSeriesSavePatch,
  resolveProductSeriesSelection,
  type ProductSeriesCategoryKey,
  type ProductSeriesConfig,
} from "@/lib/product-series-config";

export {
  encodeAdminSeriesSelectValue,
  getAdminProductSeriesPatch,
  getAdminProductSeriesSelectOptions,
  getAdminProductSeriesSelectValue,
  getAdminSeriesGroupedSelectOptions,
  parseAdminSeriesSelectValue,
  resolveAdminSeriesSavePatch,
};

export type AdminProductRow = Record<string, unknown>;

function strField(row: AdminProductRow, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value.trim() : "";
}

export type AdminProductMajorCategory = {
  key: "engineering" | "touring" | "other";
  label: string;
};

/** 前台导航 / 产品中心使用的大类（可编辑，映射到 productLine） */
export type AdminCatalogCategory = "engineering" | "touring" | "other";

export const ADMIN_CATALOG_CATEGORY_LABELS: Record<AdminCatalogCategory, string> = {
  engineering: "工程系列",
  touring: "流动演出",
  other: "未设置 / 其他",
};

export const ADMIN_ENGINEERING_PRODUCT_LINES = getEngineeringSeriesOrder().map(
  (entry) => entry.key
);

export type AdminEngineeringProductLine = (typeof ADMIN_ENGINEERING_PRODUCT_LINES)[number];

/** 后台产品列表筛选（与前台 productLine 体系对齐） */
export type AdminProductCatalogFilter =
  | "all"
  | "engineering"
  | "touring"
  | "other"
  | AdminEngineeringProductLine;

export function getAdminProductCatalogTabs(
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): ReadonlyArray<{ id: AdminProductCatalogFilter; label: string }> {
  return [
    { id: "all", label: "全部" },
    { id: "engineering", label: "工程系列" },
    { id: "touring", label: "流动演出" },
    { id: "other", label: "未设置" },
    ...getEngineeringSeriesOrder(config).map((entry) => ({
      id: entry.key as AdminEngineeringProductLine,
      label: entry.labelZh.replace(" 系列", "").replace("系列", ""),
    })),
  ];
}

/** @deprecated 使用 getAdminProductCatalogTabs(config) */
export const ADMIN_PRODUCT_CATALOG_TABS = getAdminProductCatalogTabs();

const CATALOG_WEIGHT = new Map<AdminCatalogCategory, number>([
  ["engineering", 0],
  ["touring", 1],
  ["other", 2],
]);

function getEngineeringLineWeight(config: ProductSeriesConfig): Map<string, number> {
  return new Map(
    getEngineeringSeriesOrder(config).map((entry, index) => [entry.key, index])
  );
}

function isEngineeringProductLine(
  productLine: string,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): productLine is AdminEngineeringProductLine {
  return getEngineeringSeriesOrder(config).some((entry) => entry.key === productLine);
}

export function getAdminCategorySelectOptions(
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): Array<{ value: ProductSeriesCategoryKey; label: string }> {
  return config.categories.map((category) => ({
    value: category.key,
    label: category.labelZh,
  }));
}

export function getAdminSeriesSelectOptions(
  config: ProductSeriesConfig,
  categoryKey: ProductSeriesCategoryKey
): Array<{ value: string; label: string }> {
  const category = config.categories.find((entry) => entry.key === categoryKey);
  if (!category) return [];
  return category.series.map((series) => ({
    value: series.key,
    label: series.labelZh,
  }));
}

/** 单一产品系列下拉当前值（统一短文案七项 → productLine key） */
export function getAdminSeriesSelectValue(
  row: AdminProductRow,
  _config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): string {
  const value = getAdminProductSeriesSelectValue({
    productLine: strField(row, "productLine"),
  });
  return value || "la";
}

/** 由 productLine + model 推导卡片角标 seriesZh / seriesEn */
export function getSeriesBadgeFromProductLine(
  productLine: string,
  model?: string,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): {
  seriesZh: string;
  seriesEn: string;
} {
  return getSeriesBadge(config, { productLine, model });
}

/** 切换 productLine 时同步角标系列名 */
export function getAdminProductLinePatch(
  productLine: string,
  model?: string,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): Partial<AdminProductRow> {
  return {
    productLine,
    ...getSeriesBadgeFromProductLine(productLine, model, config),
  };
}

export function getAdminSeriesSelectionPatch(
  config: ProductSeriesConfig,
  categoryKey: ProductSeriesCategoryKey,
  seriesKey: string,
  model?: string
): Partial<AdminProductRow> {
  if (categoryKey === "engineering" && isProductSeriesDisplayKey(seriesKey)) {
    return getAdminProductSeriesPatch(seriesKey);
  }
  return getAdminSeriesPatch(config, categoryKey, seriesKey, model);
}

export function resolveAdminSeriesSelection(
  row: AdminProductRow,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): {
  category: AdminCatalogCategory;
  seriesKey: string | null;
} {
  const resolved = resolveProductSeriesSelection(config, {
    productLine: strField(row, "productLine"),
    model: strField(row, "model"),
    seriesZh: strField(row, "seriesZh"),
  });
  if (resolved.category === "other") {
    return { category: "other", seriesKey: null };
  }
  return {
    category: resolved.category,
    seriesKey: resolved.seriesKey,
  };
}

/** 前台大类：仅读取 productLine（与前台逻辑一致） */
export function getAdminCatalogCategory(
  row: AdminProductRow,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): AdminCatalogCategory {
  return resolveAdminSeriesSelection(row, config).category;
}

/** 切换一级分类时写入默认二级系列 */
export function getAdminCatalogCategoryPatch(
  category: AdminCatalogCategory,
  row: AdminProductRow,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): Partial<AdminProductRow> {
  if (category === "other") return {};

  const current = resolveAdminSeriesSelection(row, config);
  if (current.category === category && current.seriesKey) {
    return {};
  }

  const seriesOptions = getAdminSeriesSelectOptions(config, category);
  const firstSeries = seriesOptions[0]?.value;
  if (!firstSeries) return {};

  return getAdminSeriesSelectionPatch(config, category, firstSeries, strField(row, "model"));
}

export function getAdminProductMajorCategory(
  row: AdminProductRow,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): AdminProductMajorCategory {
  const catalog = getAdminCatalogCategory(row, config);
  if (catalog === "engineering") {
    return { key: "engineering", label: "工程系列" };
  }
  if (catalog === "touring") {
    return { key: "touring", label: "流动演出" };
  }
  return { key: "other", label: "未设置 / 其他" };
}

export function matchAdminProductCatalogFilter(
  row: AdminProductRow,
  filter: AdminProductCatalogFilter,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): boolean {
  if (filter === "all") return true;
  const productLine = strField(row, "productLine");
  const catalog = getAdminCatalogCategory(row, config);
  if (filter === "engineering") return catalog === "engineering";
  if (filter === "touring") return catalog === "touring";
  if (filter === "other") return catalog === "other";
  return productLine === filter;
}

export function countAdminProductsByCatalogFilter(
  rows: AdminProductRow[],
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): Record<AdminProductCatalogFilter, number> {
  const tabs = getAdminProductCatalogTabs(config);
  const counts = Object.fromEntries(tabs.map((tab) => [tab.id, 0])) as Record<
    AdminProductCatalogFilter,
    number
  >;
  for (const row of rows) {
    for (const tab of tabs) {
      if (matchAdminProductCatalogFilter(row, tab.id, config)) {
        counts[tab.id] += 1;
      }
    }
  }
  return counts;
}

export function compareAdminProductRows(
  a: AdminProductRow,
  b: AdminProductRow,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): number {
  const catalogA = getAdminCatalogCategory(a, config);
  const catalogB = getAdminCatalogCategory(b, config);
  const weightA = CATALOG_WEIGHT.get(catalogA) ?? 99;
  const weightB = CATALOG_WEIGHT.get(catalogB) ?? 99;
  if (weightA !== weightB) return weightA - weightB;

  const lineWeightMap = getEngineeringLineWeight(config);
  const lineA = strField(a, "productLine");
  const lineB = strField(b, "productLine");
  const lineWeightA = isEngineeringProductLine(lineA, config)
    ? (lineWeightMap.get(lineA) ?? 99)
    : 99;
  const lineWeightB = isEngineeringProductLine(lineB, config)
    ? (lineWeightMap.get(lineB) ?? 99)
    : 99;
  if (lineWeightA !== lineWeightB) return lineWeightA - lineWeightB;

  const orderA = Number(a.sortOrder);
  const orderB = Number(b.sortOrder);
  const safeA = Number.isFinite(orderA) ? orderA : Number.MAX_SAFE_INTEGER;
  const safeB = Number.isFinite(orderB) ? orderB : Number.MAX_SAFE_INTEGER;
  if (safeA !== safeB) return safeA - safeB;

  return String(a.model ?? "").localeCompare(String(b.model ?? ""), "zh-Hans-CN");
}

export function getAdminProductLineLabel(
  productLine: string,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): string {
  const key = productLine.trim();
  if (!key) return "未设置";
  const engineering = getEngineeringSeriesOrder(config).find((entry) => entry.key === key);
  if (engineering) return engineering.labelZh;
  if (key === "tour") return ADMIN_CATALOG_CATEGORY_LABELS.touring;
  return key;
}

export type AdminProductRowMeta = {
  subtitle: string;
  majorCategory: AdminProductMajorCategory;
};

export function getAdminProductRowMeta(
  row: AdminProductRow,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): AdminProductRowMeta {
  const productLine = strField(row, "productLine");
  const seriesZh = strField(row, "seriesZh");
  const seriesEn = strField(row, "seriesEn");
  const sortOrder = Number(row.sortOrder);
  const majorCategory = getAdminProductMajorCategory(row, config);

  const parts = [
    `大类 ${majorCategory.label}`,
    productLine
      ? `系列 ${getAdminProductLineLabel(productLine, config)} (${productLine})`
      : null,
    seriesZh ? `中文 ${seriesZh}` : null,
    seriesEn ? `EN ${seriesEn}` : null,
    Number.isInteger(sortOrder) && sortOrder > 0 ? `#${sortOrder}` : null,
  ].filter(Boolean);

  return {
    subtitle: parts.join(" · "),
    majorCategory,
  };
}
