import {
  getAboutImages,
  getCases,
  getContactInfo,
  getDownloads,
  getGlobalSetting,
  getProducts,
} from "@/lib/fetchCMS";
import type { LkgContentType } from "@/lib/cms-lkg-cache";
import { cmsLog } from "@/lib/cms-lkg-cache";
import { fetchSeriesConfigFromCMS } from "@/lib/fetch-series-config";
import type { AdminCollection } from "@/lib/strapi-admin";
import { getCmsUrl } from "@/lib/strapi-client";
import { probeStrapiApi, resetCmsHealthCache } from "@/lib/cms-health";

export type CacheRefreshResult = {
  ok: boolean;
  module: string;
  savedAt: string;
  contentTypes: LkgContentType[];
  errorMessage?: string;
};

const COLLECTION_TO_TYPES: Partial<Record<AdminCollection | "contact-info" | "global-setting", LkgContentType[]>> = {
  products: ["products"],
  cases: ["cases"],
  downloads: ["downloads"],
  "about-sections": ["about"],
  scenes: ["scenes"],
  "product-series-configs": ["productSeries"],
  "contact-info": ["contact", "globalSetting"],
  "global-setting": ["globalSetting", "contact"],
  leads: [],
  "qr-codes": [],
};

async function refreshContentType(type: LkgContentType): Promise<void> {
  switch (type) {
    case "products":
      await getProducts();
      break;
    case "cases":
      await getCases();
      break;
    case "downloads":
      await getDownloads();
      break;
    case "about":
      await getAboutImages();
      break;
    case "contact":
      await getContactInfo();
      break;
    case "globalSetting":
      await getGlobalSetting();
      break;
    case "productSeries":
      await fetchSeriesConfigFromCMS();
      break;
    case "scenes":
      await (await import("@/lib/fetchCMS")).getScenes();
      break;
  }
}

export async function refreshLkgForAdminCollection(
  collection: AdminCollection | "contact-info" | "global-setting"
): Promise<CacheRefreshResult> {
  const types = COLLECTION_TO_TYPES[collection] ?? [];
  const savedAt = new Date().toISOString();
  if (!types.length) {
    return { ok: true, module: collection, savedAt, contentTypes: [] };
  }

  try {
    resetCmsHealthCache();
    const probe = await probeStrapiApi();
    if (!probe.ok) {
      return {
        ok: false,
        module: collection,
        savedAt,
        contentTypes: types,
        errorMessage: probe.errorMessage ?? "Strapi 不可用",
      };
    }

    for (const type of types) {
      await refreshContentType(type);
    }
    cmsLog(`cache refresh success ${collection}`);
    return { ok: true, module: collection, savedAt, contentTypes: types };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "缓存刷新失败";
    cmsLog(`cache refresh failed ${collection}: ${errorMessage}`);
    return {
      ok: false,
      module: collection,
      savedAt,
      contentTypes: types,
      errorMessage,
    };
  }
}

export async function refreshAllLkgCaches(): Promise<{
  ok: boolean;
  results: CacheRefreshResult[];
  sourceUrl: string;
}> {
  const sourceUrl = getCmsUrl();
  const collections = [
    "products",
    "cases",
    "downloads",
    "about-sections",
    "scenes",
    "product-series-configs",
    "contact-info",
  ] as const;

  const results: CacheRefreshResult[] = [];
  for (const collection of collections) {
    results.push(await refreshLkgForAdminCollection(collection));
  }

  return {
    ok: results.every((r) => r.ok),
    results,
    sourceUrl,
  };
}
