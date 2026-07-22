import type { Locale, Product } from "@/data/mock";
import {
  DEFAULT_PRODUCT_SERIES_CONFIG,
  findTouringProduct,
  getEngineeringProductLines,
  getTouringSeriesOrder,
  getUnifiedEngineeringSeriesEntries,
  isEngineeringProductLine,
  isTouringSeriesKey,
  type ProductSeriesConfig,
} from "@/lib/product-series-config";
import {
  getProductSeriesHref,
  type ProductSeriesTabFilter,
} from "@/lib/product-series-tabs";

export type ProductCategoryType = "engineering" | "touring";

export type EngineeringSeriesNavItem = {
  key: ProductSeriesTabFilter;
  labelZh: string;
  labelEn: string;
  href: string;
};

export type TouringProductNavItem = {
  key: string;
  labelZh: string;
  labelEn: string;
  href: string;
  sortOrder: number;
  model: string;
  /** CMS 产品名称，导航展示优先用此字段 */
  name: { zh: string; en: string };
  /** CMS 系列文案 */
  series?: { zh: string; en: string };
};

/** @deprecated 使用 getUnifiedEngineeringSeriesEntries() */
export const ENGINEERING_SERIES_ORDER = getUnifiedEngineeringSeriesEntries();

/** @deprecated 使用 getTouringSeriesOrder(config) */
export const TOURING_PRODUCT_ORDER = getTouringSeriesOrder().map((entry) => ({
  key: entry.key,
  labelZh: entry.labelZh,
  labelEn: entry.labelEn,
  modelMatchers: entry.modelMatchers,
}));

export const PRODUCT_CATEGORY_LABELS: Record<
  ProductCategoryType,
  { zh: string; en: string }
> = {
  engineering: { zh: "工程系列", en: "Engineering" },
  touring: { zh: "流动演出", en: "Touring" },
};

/** 工程系列 productLine（与后台 / 前台筛选一致） */
export const ENGINEERING_PRODUCT_LINES = getEngineeringProductLines() as readonly string[];

export type EngineeringProductLine = (typeof ENGINEERING_PRODUCT_LINES)[number];

const ENGINEERING_PRODUCT_LINE_SET = new Set<string>(ENGINEERING_PRODUCT_LINES);

function isEngineeringProductLineValue(productLine: string): productLine is EngineeringProductLine {
  return ENGINEERING_PRODUCT_LINE_SET.has(productLine);
}

export function getProductCategoryType(product: Product): ProductCategoryType | null {
  const line = product.productLine;
  if (line === "tour") return "touring";
  if (line && isEngineeringProductLineValue(line)) return "engineering";
  return null;
}

export function matchEngineeringProductLine(
  product: Product,
  series: ProductSeriesTabFilter
): boolean {
  if (series === "all") return true;
  return product.productLine === series;
}

export function isEngineeringProduct(product: Product): boolean {
  return getProductCategoryType(product) === "engineering";
}

export function isTouringProduct(product: Product): boolean {
  return product.productLine === "tour";
}

export function getEngineeringSeriesNavItems(
  products: Product[],
  options?: { hideEmpty?: boolean; config?: ProductSeriesConfig }
): EngineeringSeriesNavItem[] {
  const hideEmpty = options?.hideEmpty ?? false;
  // 导航与产品页 / 后台同一套 PRODUCT_SERIES_DISPLAY（不含电子产品）
  const order = getUnifiedEngineeringSeriesEntries();

  return order
    .filter((entry) => {
      if (!hideEmpty) return true;
      return products.some((product) => product.productLine === entry.key);
    })
    .map((entry) => ({
      key: entry.key,
      labelZh: entry.labelZh,
      labelEn: entry.labelEn,
      href: getProductSeriesHref(entry.key),
    }));
}

export function getTouringProductNavItems(
  products: Product[],
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): {
  items: TouringProductNavItem[];
  unmatched: string[];
} {
  const items: TouringProductNavItem[] = [];
  const unmatched: string[] = [];

  for (const entry of getTouringSeriesOrder(config)) {
    const product = findTouringProduct(config, products, entry.key);
    const sortOrder = Number(product?.id);
    if (!product || !Number.isInteger(sortOrder) || sortOrder <= 0) {
      unmatched.push(entry.labelZh);
      continue;
    }

    items.push({
      key: entry.key,
      labelZh: entry.labelZh,
      labelEn: entry.labelEn,
      href: `/products/${sortOrder}`,
      sortOrder,
      model: product.model,
      name: {
        zh: product.name?.zh?.trim() || product.model,
        en: product.name?.en?.trim() || product.name?.zh?.trim() || product.model,
      },
      series: product.series,
    });
  }

  return { items, unmatched };
}

export function getProductCategoryLabel(
  category: ProductCategoryType,
  locale: Locale
): string {
  return PRODUCT_CATEGORY_LABELS[category][locale];
}

export function getEngineeringSeriesLabel(
  item: Pick<EngineeringSeriesNavItem, "labelZh" | "labelEn">,
  locale: Locale
): string {
  return locale === "zh" ? item.labelZh : item.labelEn;
}

export function getTouringProductLabel(
  item: Pick<TouringProductNavItem, "name" | "model" | "labelZh" | "labelEn" | "series">,
  locale: Locale
): string {
  const name = item.name?.[locale]?.trim() || item.name?.zh?.trim() || item.name?.en?.trim();
  if (name) return name;
  return item.model?.trim() || (locale === "zh" ? item.labelZh : item.labelEn);
}

export function isTouringNavProduct(
  product: Product,
  touringItems: TouringProductNavItem[]
): boolean {
  return touringItems.some((item) => item.sortOrder === product.id);
}

export function filterEngineeringProducts(products: Product[]): Product[] {
  return products.filter(
    (product) => product.productLine && isEngineeringProductLine(product.productLine)
  );
}

export function filterTouringProducts(products: Product[]): Product[] {
  return products.filter((product) => product.productLine === "tour");
}

const ENGINEERING_LINE_WEIGHT = new Map(
  ENGINEERING_PRODUCT_LINES.map((line, index) => [line, index])
);

/** 按 productLine 与工程系列固定顺序排列 */
export function sortEngineeringProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const lineA = a.productLine && isEngineeringProductLineValue(a.productLine) ? a.productLine : null;
    const lineB = b.productLine && isEngineeringProductLineValue(b.productLine) ? b.productLine : null;
    const weightA = lineA ? (ENGINEERING_LINE_WEIGHT.get(lineA) ?? 999) : 999;
    const weightB = lineB ? (ENGINEERING_LINE_WEIGHT.get(lineB) ?? 999) : 999;
    if (weightA !== weightB) return weightA - weightB;
    return (Number(a.id) || 0) - (Number(b.id) || 0);
  });
}

/** 按流动演出导航固定顺序排列（未在导航表中的 tour 产品排在后面） */
export function sortTouringNavProducts(
  products: Product[],
  touringItems: TouringProductNavItem[]
): Product[] {
  const order = new Map(touringItems.map((item, index) => [item.sortOrder, index]));
  return [...products].sort((a, b) => {
    const indexA = order.get(a.id) ?? 1000 + (Number(a.id) || 0);
    const indexB = order.get(b.id) ?? 1000 + (Number(b.id) || 0);
    return indexA - indexB;
  });
}

export function isTouringProductKey(
  value: string,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): boolean {
  return isTouringSeriesKey(config, value);
}
