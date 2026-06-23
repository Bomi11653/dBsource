import type { ProductSeriesGroup } from "@/data/mock";
import { shouldUseMockData } from "@/lib/cms-data-source";
import { withLastKnownGood } from "@/lib/cms-lkg-cache";
import { fetchStrapiCollection, getCmsUrl } from "@/lib/strapi-client";
import type { SeriesConfigEntry } from "@/lib/series-config";
import type { ProductSubSeriesSlug } from "@/lib/products";

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
  if (shouldUseMockData()) return null;

  const query = "/product-series-configs?sort[0]=sortOrder:asc&pagination[pageSize]=50";
  return withLastKnownGood(
    "productSeries",
    `${getCmsUrl()}${query}`,
    async () => {
      const docs = await fetchStrapiCollection<StrapiSeriesDoc>(query);
      if (!docs.length) return null;
      return docs.map(mapStrapiSeries);
    },
    null
  );
}
