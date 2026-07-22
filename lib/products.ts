import type { Locale, Product, ProductSeriesGroup } from "@/data/mock";
import { products } from "@/data/mock";
import { resolveBrowserMediaUrl } from "@/lib/media-url";
import { PRODUCT_SERIES_DISPLAY } from "@/lib/product-series-config";
import { rankProductsForList } from "@/lib/search/rank-search";

export type ProductSubSeriesSlug = string;

export interface ProductSubSeries {
  slug: ProductSubSeriesSlug;
  seriesGroup: ProductSeriesGroup;
  label: { zh: string; en: string };
  modelPrefix: string;
  featuredProductId: number;
}

const UNIFIED_LABEL_BY_KEY = Object.fromEntries(
  PRODUCT_SERIES_DISPLAY.map((entry) => [
    entry.key,
    { zh: entry.labelZh, en: entry.labelEn },
  ])
) as Record<string, { zh: string; en: string }>;

/**
 * 历史子系列元数据（AI / featured 等）。
 * 统一七项文案派生自 PRODUCT_SERIES_DISPLAY，避免与前台/后台再写一套 map。
 */
export const PRODUCT_SUB_SERIES: ProductSubSeries[] = [
  {
    slug: "la",
    seriesGroup: "speaker",
    label: UNIFIED_LABEL_BY_KEY.la,
    modelPrefix: "LA",
    featuredProductId: 1,
  },
  {
    slug: "lw",
    seriesGroup: "speaker",
    label: UNIFIED_LABEL_BY_KEY.lw,
    modelPrefix: "LW",
    featuredProductId: 10,
  },
  {
    slug: "mi",
    seriesGroup: "speaker",
    label: UNIFIED_LABEL_BY_KEY.mi,
    modelPrefix: "MI",
    featuredProductId: 19,
  },
  {
    slug: "do",
    seriesGroup: "speaker",
    label: UNIFIED_LABEL_BY_KEY.do,
    modelPrefix: "DO",
    featuredProductId: 21,
  },
  {
    slug: "sol",
    seriesGroup: "speaker",
    label: UNIFIED_LABEL_BY_KEY.sol,
    modelPrefix: "SOL",
    featuredProductId: 31,
  },
  {
    slug: "k",
    seriesGroup: "speaker",
    label: UNIFIED_LABEL_BY_KEY.k,
    modelPrefix: "K",
    featuredProductId: 34,
  },
  {
    slug: "re",
    seriesGroup: "speaker",
    label: UNIFIED_LABEL_BY_KEY.re,
    modelPrefix: "RE",
    featuredProductId: 38,
  },
  {
    slug: "tour",
    seriesGroup: "speaker",
    label: { zh: "流动演出系统", en: "Touring Systems" },
    modelPrefix: "V",
    featuredProductId: 42,
  },
  {
    slug: "p",
    seriesGroup: "speaker",
    label: { zh: "P 系列塑胶音箱", en: "P Plastic Enclosure" },
    modelPrefix: "P",
    featuredProductId: 8,
  },
  {
    slug: "driver",
    seriesGroup: "speaker",
    label: { zh: "喇叭单元", en: "Drivers" },
    modelPrefix: "DU",
    featuredProductId: 9,
  },
  {
    slug: "electronics",
    seriesGroup: "speaker",
    label: { zh: "电子产品", en: "Electronics" },
    modelPrefix: "EL",
    featuredProductId: 52,
  },
  {
    slug: "accessory",
    seriesGroup: "speaker",
    label: { zh: "配件", en: "Accessories" },
    modelPrefix: "AC",
    featuredProductId: 11,
  },
  {
    slug: "unit48",
    seriesGroup: "dsp",
    label: { zh: "unit48 系列", en: "unit48 Series" },
    modelPrefix: "Unit48",
    featuredProductId: 54,
  },
  {
    slug: "suite",
    seriesGroup: "software",
    label: { zh: "dBcover 软件", en: "dBcover Software" },
    modelPrefix: "dBcover",
    featuredProductId: 55,
  },
  {
    slug: "turnkey",
    seriesGroup: "engineering",
    label: { zh: "工程方案", en: "Engineering" },
    modelPrefix: "SI",
    featuredProductId: 14,
  },
];

/** 前台只展示三大类板块：音箱系列 / 电子周边 / 软件 */
export const PRODUCT_SERIES_GROUPS: ProductSeriesGroup[] = [
  "speaker",
  "dsp",
  "software",
];

export function getSubSeriesBySlug(slug: string): ProductSubSeries | undefined {
  return PRODUCT_SUB_SERIES.find((s) => s.slug === slug);
}

export function subSeriesLabel(sub: ProductSubSeries, locale: Locale): string {
  return sub.label[locale];
}

export function searchProducts(list: Product[], query: string, locale: Locale = "zh"): Product[] {
  const q = query.trim();
  if (!q) return list;
  return rankProductsForList(q, list, locale);
}

/** Cover + gallery from CMS; URL-deduped, any count (0 → fallback to cover only). */
export function getProductGallery(product: Product): string[] {
  const seen = new Set<string>();
  const norm = (url: string) => resolveBrowserMediaUrl(url);
  const gallery = (product.gallery ?? [])
    .map(norm)
    .filter((url) => {
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
  if (gallery.length > 0) {
    const cover = product.image ? norm(product.image) : "";
    if (cover && !seen.has(cover)) {
      return [cover, ...gallery];
    }
    return gallery;
  }
  return product.image ? [norm(product.image)] : [];
}

export function getProductById(id: number): Product | undefined {
  return products.find((p) => p.id === id);
}
