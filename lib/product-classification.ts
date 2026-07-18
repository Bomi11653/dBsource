import type { Locale, Product } from "@/data/mock";
import {
  getProductSeriesHref,
  getProductSeriesTab,
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
};

/** 工程系列固定顺序（与 /products?series=xxx 对齐） */
export const ENGINEERING_SERIES_ORDER: ReadonlyArray<{
  key: ProductSeriesTabFilter;
  labelZh: string;
  labelEn: string;
}> = [
  { key: "la", labelZh: "LA 系列", labelEn: "LA Series" },
  { key: "mi", labelZh: "MI 系列", labelEn: "MI Series" },
  { key: "do", labelZh: "DO 系列", labelEn: "DO Series" },
  { key: "sol", labelZh: "SOL 系列", labelEn: "SOL Series" },
  { key: "lw", labelZh: "LW 系列", labelEn: "LW Series" },
  { key: "re", labelZh: "RE 系列", labelEn: "RE Series" },
  { key: "k", labelZh: "K 系列", labelEn: "K Series" },
  { key: "electronics", labelZh: "电子产品", labelEn: "Electronics" },
];

/** 流动演出固定顺序（按展示名匹配 CMS 产品） */
export const TOURING_PRODUCT_ORDER: ReadonlyArray<{
  key: string;
  labelZh: string;
  labelEn: string;
  modelMatchers: string[];
}> = [
  { key: "solo-c", labelZh: "Solo C", labelEn: "Solo C", modelMatchers: ["solo c", "soloc"] },
  { key: "206m", labelZh: "206M", labelEn: "206M", modelMatchers: ["206m"] },
  { key: "15n", labelZh: "15N", labelEn: "15N", modelMatchers: ["15n"] },
  { key: "v4", labelZh: "V4", labelEn: "V4", modelMatchers: ["v4"] },
  {
    key: "vit",
    labelZh: "VIT(V12-V18)",
    labelEn: "VIT (V12–V18)",
    modelMatchers: ["vit"],
  },
  {
    key: "v212-v221s",
    labelZh: "V212-V221S",
    labelEn: "V212–V221S",
    modelMatchers: ["v212"],
  },
  { key: "v415a", labelZh: "V415A", labelEn: "V415A", modelMatchers: ["v415a"] },
  { key: "v225a", labelZh: "V225A", labelEn: "V225A", modelMatchers: ["v225a"] },
];

export const PRODUCT_CATEGORY_LABELS: Record<
  ProductCategoryType,
  { zh: string; en: string }
> = {
  engineering: { zh: "工程系列", en: "Engineering" },
  touring: { zh: "流动演出", en: "Touring" },
};

/** 工程系列 productLine（与后台 / 前台筛选一致） */
export const ENGINEERING_PRODUCT_LINES = [
  "la",
  "mi",
  "do",
  "sol",
  "lw",
  "re",
  "k",
  "electronics",
] as const;

export type EngineeringProductLine = (typeof ENGINEERING_PRODUCT_LINES)[number];

const ENGINEERING_PRODUCT_LINE_SET = new Set<string>(ENGINEERING_PRODUCT_LINES);

function isEngineeringProductLineValue(productLine: string): productLine is EngineeringProductLine {
  return ENGINEERING_PRODUCT_LINE_SET.has(productLine);
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
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

export function getProductSeriesKey(product: Product): ProductSeriesTabFilter {
  return getProductSeriesTab(product);
}

function modelMatches(product: Product, matcher: string): boolean {
  const target = normalize(matcher);
  const model = normalize(product.model);
  const nameZh = normalize(product.name.zh);
  const nameEn = normalize(product.name.en);

  if (target === "v4") {
    return model === "v4";
  }

  return model === target || nameZh === target || nameEn === target;
}

export function findTouringProduct(
  products: Product[],
  modelMatchers: string[]
): Product | undefined {
  const pool = products.filter((product) => product.productLine === "tour");
  for (const matcher of modelMatchers) {
    const found = pool.find((product) => modelMatches(product, matcher));
    if (found) return found;
  }
  return undefined;
}

export function getEngineeringSeriesNavItems(
  products: Product[],
  options?: { hideEmpty?: boolean }
): EngineeringSeriesNavItem[] {
  const hideEmpty = options?.hideEmpty ?? false;

  return ENGINEERING_SERIES_ORDER.filter((entry) => {
    if (!hideEmpty) return true;
    return products.some((product) => product.productLine === entry.key);
  }).map((entry) => ({
    key: entry.key,
    labelZh: entry.labelZh,
    labelEn: entry.labelEn,
    href: getProductSeriesHref(entry.key),
  }));
}

export function getTouringProductNavItems(products: Product[]): {
  items: TouringProductNavItem[];
  unmatched: string[];
} {
  const items: TouringProductNavItem[] = [];
  const unmatched: string[] = [];

  for (const entry of TOURING_PRODUCT_ORDER) {
    const product = findTouringProduct(products, entry.modelMatchers);
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
  item: Pick<TouringProductNavItem, "labelZh" | "labelEn">,
  locale: Locale
): string {
  return locale === "zh" ? item.labelZh : item.labelEn;
}

export function isTouringNavProduct(
  product: Product,
  touringItems: TouringProductNavItem[]
): boolean {
  return touringItems.some((item) => item.sortOrder === product.id);
}

export function filterEngineeringProducts(products: Product[]): Product[] {
  return products.filter(
    (product) => product.productLine && isEngineeringProductLineValue(product.productLine)
  );
}

export function filterTouringProducts(products: Product[]): Product[] {
  return products.filter((product) => product.productLine === "tour");
}

/** @deprecated 使用 filterTouringProducts；touringItems 仅用于排序 */
export function filterTouringNavProducts(
  products: Product[],
  _touringItems: TouringProductNavItem[]
): Product[] {
  return filterTouringProducts(products);
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

export function isTouringProductKey(value: string): boolean {
  return TOURING_PRODUCT_ORDER.some((entry) => entry.key === value);
}
