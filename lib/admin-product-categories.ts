import {
  ENGINEERING_PRODUCT_LINES,
  ENGINEERING_SERIES_ORDER,
} from "@/lib/product-classification";

export type AdminProductRow = Record<string, unknown>;

const SERIES_GROUP_LABELS: Record<string, string> = {
  speaker: "音箱",
  dsp: "处理器",
  software: "软件",
  engineering: "工程",
};

/** 后台产品系列 key 可读标签（不改 schema，仅显示） */
export const ADMIN_PRODUCT_LINE_LABELS: Record<string, string> = {
  la: "LA 线阵列",
  lw: "LW 中远程",
  mi: "MI 返送",
  do: "DO 全频",
  sol: "SOL 音柱",
  k: "K 系列",
  re: "RE 全频",
  p: "P 塑胶",
  driver: "喇叭单元",
  electronics: "电子周边",
  accessory: "配件",
  tour: "流动演出",
  unit48: "Unit48",
  suite: "dBcover 软件",
  turnkey: "工程方案",
  c: "C 端",
};

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

export const ADMIN_ENGINEERING_PRODUCT_LINES = ENGINEERING_PRODUCT_LINES;

export type AdminEngineeringProductLine = (typeof ENGINEERING_PRODUCT_LINES)[number];

/** 后台产品列表筛选（与前台 productLine 体系对齐） */
export type AdminProductCatalogFilter =
  | "all"
  | "engineering"
  | "touring"
  | "other"
  | AdminEngineeringProductLine;

export const ADMIN_PRODUCT_CATALOG_TABS: ReadonlyArray<{
  id: AdminProductCatalogFilter;
  label: string;
}> = [
  { id: "all", label: "全部" },
  { id: "engineering", label: "工程系列" },
  { id: "touring", label: "流动演出" },
  { id: "other", label: "未设置" },
  ...ENGINEERING_SERIES_ORDER.map((entry) => ({
    id: entry.key as AdminEngineeringProductLine,
    label: entry.labelZh.replace(" 系列", "").replace("产品", ""),
  })),
];

const CATALOG_WEIGHT = new Map<AdminCatalogCategory, number>([
  ["engineering", 0],
  ["touring", 1],
  ["other", 2],
]);

const ENGINEERING_LINE_WEIGHT = new Map(
  ENGINEERING_PRODUCT_LINES.map((line, index) => [line, index])
);

function isEngineeringProductLine(productLine: string): productLine is AdminEngineeringProductLine {
  return (ENGINEERING_PRODUCT_LINES as readonly string[]).includes(productLine);
}

export function getAdminEngineeringSeriesSelectOptions(): Array<{ value: string; label: string }> {
  return ENGINEERING_SERIES_ORDER.map((entry) => ({
    value: entry.key,
    label: `${entry.labelZh}（${entry.key}）`,
  }));
}

/** 前台大类：仅读取 productLine（与前台逻辑一致） */
export function getAdminCatalogCategory(row: AdminProductRow): AdminCatalogCategory {
  const productLine = strField(row, "productLine");
  if (productLine === "tour") return "touring";
  if (isEngineeringProductLine(productLine)) return "engineering";
  return "other";
}

/** 切换前台大类时写入 productLine（不改 schema） */
export function getAdminCatalogCategoryPatch(
  category: AdminCatalogCategory,
  row: AdminProductRow
): Partial<AdminProductRow> {
  const productLine = strField(row, "productLine");
  if (category === "touring") {
    return { productLine: "tour" };
  }
  if (category === "engineering") {
    if (productLine === "tour" || !isEngineeringProductLine(productLine)) {
      return { productLine: "la" };
    }
    return {};
  }
  return {};
}

export function getAdminProductMajorCategory(row: AdminProductRow): AdminProductMajorCategory {
  const catalog = getAdminCatalogCategory(row);
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
  filter: AdminProductCatalogFilter
): boolean {
  if (filter === "all") return true;
  const productLine = strField(row, "productLine");
  const catalog = getAdminCatalogCategory(row);
  if (filter === "engineering") return catalog === "engineering";
  if (filter === "touring") return catalog === "touring";
  if (filter === "other") return catalog === "other";
  return productLine === filter;
}

export function countAdminProductsByCatalogFilter(
  rows: AdminProductRow[]
): Record<AdminProductCatalogFilter, number> {
  const counts = Object.fromEntries(
    ADMIN_PRODUCT_CATALOG_TABS.map((tab) => [tab.id, 0])
  ) as Record<AdminProductCatalogFilter, number>;
  for (const row of rows) {
    for (const tab of ADMIN_PRODUCT_CATALOG_TABS) {
      if (matchAdminProductCatalogFilter(row, tab.id)) {
        counts[tab.id] += 1;
      }
    }
  }
  return counts;
}

export function compareAdminProductRows(a: AdminProductRow, b: AdminProductRow): number {
  const catalogA = getAdminCatalogCategory(a);
  const catalogB = getAdminCatalogCategory(b);
  const weightA = CATALOG_WEIGHT.get(catalogA) ?? 99;
  const weightB = CATALOG_WEIGHT.get(catalogB) ?? 99;
  if (weightA !== weightB) return weightA - weightB;

  const lineA = strField(a, "productLine");
  const lineB = strField(b, "productLine");
  const lineWeightA = isEngineeringProductLine(lineA)
    ? (ENGINEERING_LINE_WEIGHT.get(lineA) ?? 99)
    : 99;
  const lineWeightB = isEngineeringProductLine(lineB)
    ? (ENGINEERING_LINE_WEIGHT.get(lineB) ?? 99)
    : 99;
  if (lineWeightA !== lineWeightB) return lineWeightA - lineWeightB;

  const orderA = Number(a.sortOrder);
  const orderB = Number(b.sortOrder);
  const safeA = Number.isFinite(orderA) ? orderA : Number.MAX_SAFE_INTEGER;
  const safeB = Number.isFinite(orderB) ? orderB : Number.MAX_SAFE_INTEGER;
  if (safeA !== safeB) return safeA - safeB;

  return String(a.model ?? a.nameZh ?? "").localeCompare(String(b.model ?? b.nameZh ?? ""));
}

export function getAdminProductLineLabel(productLine: string): string {
  const key = productLine.trim();
  if (!key) return "未设置";
  return ADMIN_PRODUCT_LINE_LABELS[key] ?? key;
}

export function getAdminSeriesGroupLabel(seriesGroup: string): string {
  const key = seriesGroup.trim();
  if (!key) return "未设置";
  return SERIES_GROUP_LABELS[key] ?? key;
}

export type AdminProductRowMeta = {
  subtitle: string;
  majorCategory: AdminProductMajorCategory;
};

export function getAdminProductRowMeta(row: AdminProductRow): AdminProductRowMeta {
  const model = strField(row, "model");
  const productLine = strField(row, "productLine");
  const seriesZh = strField(row, "seriesZh");
  const seriesEn = strField(row, "seriesEn");
  const sortOrder = Number(row.sortOrder);
  const majorCategory = getAdminProductMajorCategory(row);

  const parts = [
    `大类 ${majorCategory.label}`,
    productLine
      ? `系列 ${getAdminProductLineLabel(productLine)} (${productLine})`
      : null,
    seriesZh ? `中文 ${seriesZh}` : null,
    seriesEn ? `EN ${seriesEn}` : null,
    Number.isInteger(sortOrder) && sortOrder > 0 ? `#${sortOrder}` : null,
    model || null,
  ].filter(Boolean);

  return {
    subtitle: parts.join(" · "),
    majorCategory,
  };
}
