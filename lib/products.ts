import type { CaseItem, Locale, Product, ProductCategory, ProductSeriesGroup } from "@/data/mock";
import { cases, products } from "@/data/mock";

export type SeriesTab = "all" | ProductSeriesGroup;
export type CategoryFilter = "all" | ProductCategory;

export type ProductSubSeriesSlug =
  | "la"
  | "lw"
  | "mi"
  | "do"
  | "sol"
  | "k"
  | "re"
  | "p"
  | "driver"
  | "electronics"
  | "accessory"
  | "tour"
  | "unit48"
  | "suite"
  | "turnkey";

export interface ProductSubSeries {
  slug: ProductSubSeriesSlug;
  seriesGroup: ProductSeriesGroup;
  label: { zh: string; en: string };
  modelPrefix: string;
  featuredProductId: number;
}

export const PRODUCT_SUB_SERIES: ProductSubSeries[] = [
  {
    slug: "la",
    seriesGroup: "speaker",
    label: { zh: "LA 线阵列音箱", en: "LA Line Array" },
    modelPrefix: "LA",
    featuredProductId: 1,
  },
  {
    slug: "lw",
    seriesGroup: "speaker",
    label: { zh: "LW 中远程防水音箱", en: "LW Medium-Throw IP" },
    modelPrefix: "LW",
    featuredProductId: 10,
  },
  {
    slug: "mi",
    seriesGroup: "speaker",
    label: { zh: "MI 返送音箱", en: "MI Stage Monitor" },
    modelPrefix: "MI",
    featuredProductId: 19,
  },
  {
    slug: "do",
    seriesGroup: "speaker",
    label: { zh: "DO 多功能全频音箱", en: "DO Full-Range" },
    modelPrefix: "DO",
    featuredProductId: 21,
  },
  {
    slug: "sol",
    seriesGroup: "speaker",
    label: { zh: "SOL 多功能防水音柱", en: "SOL IP Column" },
    modelPrefix: "SOL",
    featuredProductId: 31,
  },
  {
    slug: "k",
    seriesGroup: "speaker",
    label: { zh: "K 系列娱乐音箱", en: "K Entertainment" },
    modelPrefix: "K",
    featuredProductId: 34,
  },
  {
    slug: "re",
    seriesGroup: "speaker",
    label: { zh: "RE 全频音箱", en: "RE Full-Range" },
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

export const PRODUCT_SERIES_GROUPS: ProductSeriesGroup[] = [
  "speaker",
  "dsp",
  "software",
  "engineering",
];

export function getSubSeriesForGroup(group: ProductSeriesGroup): ProductSubSeries[] {
  return PRODUCT_SUB_SERIES.filter((s) => s.seriesGroup === group);
}

export function getSubSeriesBySlug(slug: string): ProductSubSeries | undefined {
  return PRODUCT_SUB_SERIES.find((s) => s.slug === slug);
}

export function subSeriesLabel(sub: ProductSubSeries, locale: Locale): string {
  return sub.label[locale];
}

export function filterProducts(
  list: Product[],
  seriesTab: SeriesTab,
  categoryFilter: CategoryFilter,
  subSeriesSlug?: ProductSubSeriesSlug | "all"
): Product[] {
  let result = list;
  if (seriesTab !== "all") {
    result = result.filter((p) => p.seriesGroup === seriesTab);
  }
  if (categoryFilter !== "all") {
    result = result.filter((p) => p.category === categoryFilter);
    if (seriesTab === "all") {
      result = result.filter((p) => p.seriesGroup !== "engineering");
    }
  }
  if (subSeriesSlug && subSeriesSlug !== "all") {
    const sub = getSubSeriesBySlug(subSeriesSlug);
    if (sub) {
      result = result.filter(
        (p) =>
          p.productLine === sub.slug ||
          p.model.startsWith(sub.modelPrefix) ||
          p.model.toUpperCase().startsWith(sub.modelPrefix.toUpperCase())
      );
    }
  }
  return result;
}

export function searchProducts(list: Product[], query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;

  return list.filter((p) => {
    const haystack = [
      p.model,
      p.name.zh,
      p.name.en,
      p.desc.zh,
      p.desc.en,
      p.detail?.zh,
      p.detail?.en,
      p.specs?.zh,
      p.specs?.en,
      p.series?.zh,
      p.series?.en,
      p.productLine,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(q) || p.model.toLowerCase().startsWith(q);
  });
}

/** Cover + gallery from CMS; URL-deduped, any count (0 → fallback to cover only). */
export function getProductGallery(product: Product): string[] {
  const seen = new Set<string>();
  const gallery = (product.gallery ?? []).filter((url) => {
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
  if (gallery.length > 0) {
    if (product.image && !seen.has(product.image)) {
      return [product.image, ...gallery];
    }
    return gallery;
  }
  return product.image ? [product.image] : [];
}

export function getProductById(id: number): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getRelatedCases(product: Product, allCases: CaseItem[] = cases): CaseItem[] {
  const prefix = product.model.split("-")[0];
  const matched = allCases.filter(
    (c) => c.products.includes(prefix) || c.products.includes(product.model)
  );
  return (matched.length ? matched : allCases).slice(0, 2);
}
