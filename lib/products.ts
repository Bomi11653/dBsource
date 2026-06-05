import type { CaseItem, Locale, Product, ProductCategory, ProductSeriesGroup } from "@/data/mock";
import { cases, products } from "@/data/mock";

export type SeriesTab = "all" | ProductSeriesGroup;
export type CategoryFilter = "all" | ProductCategory;

export type ProductSubSeriesSlug =
  | "tour"
  | "lf"
  | "stage"
  | "install"
  | "electronics"
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
    slug: "tour",
    seriesGroup: "speaker",
    label: { zh: "Tour 系列", en: "Tour Series" },
    modelPrefix: "X",
    featuredProductId: 1,
  },
  {
    slug: "lf",
    seriesGroup: "speaker",
    label: { zh: "低频系列", en: "LF Series" },
    modelPrefix: "S",
    featuredProductId: 2,
  },
  {
    slug: "stage",
    seriesGroup: "speaker",
    label: { zh: "舞台系列", en: "Stage Series" },
    modelPrefix: "M",
    featuredProductId: 3,
  },
  {
    slug: "install",
    seriesGroup: "speaker",
    label: { zh: "固定安装", en: "Install Series" },
    modelPrefix: "P",
    featuredProductId: 4,
  },
  {
    slug: "electronics",
    seriesGroup: "speaker",
    label: { zh: "电子系列", en: "Electronics" },
    modelPrefix: "A",
    featuredProductId: 5,
  },
  {
    slug: "unit48",
    seriesGroup: "dsp",
    label: { zh: "unit48 系列", en: "unit48 Series" },
    modelPrefix: "D",
    featuredProductId: 6,
  },
  {
    slug: "suite",
    seriesGroup: "software",
    label: { zh: "软件系列", en: "Software Suite" },
    modelPrefix: "SW",
    featuredProductId: 7,
  },
  {
    slug: "turnkey",
    seriesGroup: "engineering",
    label: { zh: "工程方案", en: "Engineering" },
    modelPrefix: "SI",
    featuredProductId: 8,
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
      result = result.filter((p) => p.model.startsWith(sub.modelPrefix));
    }
  }
  return result;
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
