import type { Locale, Product, ProductSeriesGroup } from "@/data/mock";
import { isCmsAvailable } from "@/lib/cms-health";
import { fetchStrapiCollection, getCmsUrl } from "@/lib/strapi-client";
import {
  PRODUCT_SERIES_GROUPS,
  PRODUCT_SUB_SERIES,
  type ProductSubSeries,
  type ProductSubSeriesSlug,
} from "@/lib/products";

export type SeriesConfigEntry = ProductSubSeries & {
  visible: boolean;
  sortOrder: number;
};

type StrapiSeriesDoc = {
  slug: string;
  seriesGroup: string;
  nameZh: string;
  nameEn: string;
  modelPrefix: string;
  sortOrder?: number;
  visible?: boolean;
  featuredProductId?: number | null;
};

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export function subSeriesMatchesProduct(sub: ProductSubSeries, product: Product): boolean {
  return (
    product.productLine === sub.slug ||
    product.model.startsWith(sub.modelPrefix) ||
    product.model.toUpperCase().startsWith(sub.modelPrefix.toUpperCase())
  );
}

export function subSeriesHasProducts(sub: ProductSubSeries, products: Product[]): boolean {
  return products.some((p) => subSeriesMatchesProduct(sub, p));
}

function defaultSeriesConfig(): SeriesConfigEntry[] {
  return PRODUCT_SUB_SERIES.map((sub, index) => ({
    ...sub,
    visible: true,
    sortOrder: index,
  }));
}

function normalizeSlug(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "series";
}

function inferModelPrefix(model: string): string {
  const matched = model.trim().match(/^[A-Za-z0-9]+/);
  return matched?.[0] || model.trim();
}

function inferSeriesFromProducts(
  products: Product[],
  existing: SeriesConfigEntry[]
): SeriesConfigEntry[] {
  const known = new Set(existing.map((entry) => entry.slug));
  let sortOrderBase =
    existing.length > 0 ? Math.max(...existing.map((entry) => entry.sortOrder)) + 1 : 0;
  const inferred: SeriesConfigEntry[] = [];

  for (const product of products) {
    if (!PRODUCT_SERIES_GROUPS.includes(product.seriesGroup)) continue;
    if (!product.productLine?.trim()) continue;

    const slug = normalizeSlug(product.productLine);
    if (known.has(slug)) continue;

    const labelZh = product.series?.zh?.trim() || product.productLine;
    const labelEn = product.series?.en?.trim() || product.productLine.toUpperCase();
    const modelPrefix = inferModelPrefix(product.model);

    inferred.push({
      slug,
      seriesGroup: product.seriesGroup,
      label: { zh: labelZh, en: labelEn },
      modelPrefix,
      featuredProductId: product.id,
      visible: true,
      sortOrder: sortOrderBase++,
    });
    known.add(slug);
  }

  return inferred;
}

function mapStrapiSeries(doc: StrapiSeriesDoc, index: number): SeriesConfigEntry {
  return {
    slug: doc.slug as ProductSubSeriesSlug,
    seriesGroup: doc.seriesGroup as ProductSeriesGroup,
    label: { zh: doc.nameZh, en: doc.nameEn },
    modelPrefix: doc.modelPrefix,
    featuredProductId: doc.featuredProductId ?? index + 1,
    visible: doc.visible !== false,
    sortOrder: doc.sortOrder ?? index,
  };
}

export async function fetchSeriesConfigFromCMS(): Promise<SeriesConfigEntry[] | null> {
  if (USE_MOCK || !(await isCmsAvailable())) return null;

  const docs = await fetchStrapiCollection<StrapiSeriesDoc>(
    "/product-series-configs?sort[0]=sortOrder:asc&pagination[pageSize]=50"
  );
  if (!docs?.length) return null;
  return docs.map(mapStrapiSeries);
}

export async function getSeriesConfig(products: Product[]): Promise<SeriesConfigEntry[]> {
  const cmsSeries = await fetchSeriesConfigFromCMS();
  const base = cmsSeries ?? defaultSeriesConfig();
  const merged = [...base, ...inferSeriesFromProducts(products, base)];

  return merged
    .filter((sub) => sub.visible !== false)
    .filter((sub) => subSeriesHasProducts(sub, products))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getSubSeriesForGroupFromConfig(
  group: ProductSeriesGroup,
  config: SeriesConfigEntry[]
): SeriesConfigEntry[] {
  return config.filter((s) => s.seriesGroup === group);
}

export function getSubSeriesBySlugFromConfig(
  slug: string,
  config: SeriesConfigEntry[]
): SeriesConfigEntry | undefined {
  return config.find((s) => s.slug === slug);
}

export function getVisibleSeriesGroups(config: SeriesConfigEntry[]): ProductSeriesGroup[] {
  const groups = new Set(config.map((s) => s.seriesGroup));
  return PRODUCT_SERIES_GROUPS.filter((g) => groups.has(g));
}

export function seriesEntryLabel(entry: Pick<SeriesConfigEntry, "label">, locale: Locale): string {
  return entry.label[locale];
}
