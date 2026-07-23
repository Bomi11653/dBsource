import { resolveBrowserMediaUrl, pickListMediaPath, resolveCmsAssetUrl } from "@/lib/media-url";
import {
  cases,
  contactInfo,
  downloads,
  globalSettingDefault,
  products,
  qrCodes,
  scenes,
  smartSelectionPageDefault,
  socialLinksDefault,
  type ContactInfo,
} from "@/data/mock";
import { aboutImages, type AboutImages } from "@/data/about";
import { fallbackSalesContacts } from "@/data/sales-contacts";
import { applyCaseImages, sortCases } from "@/lib/cases";
import { shouldUseMockData } from "@/lib/cms-data-source";
import { withLastKnownGood, writeLkgCache } from "@/lib/cms-lkg-cache";
import {
  buildProductSeriesConfig,
  DEFAULT_PRODUCT_SERIES_CONFIG,
  type CmsProductSeriesRow,
  type ProductSeriesConfig,
} from "@/lib/product-series-config";
import {
  CMS_FETCH_TAGS,
  FRONTEND_REVALIDATE_SECONDS,
  fetchStrapiCollection,
  fetchStrapiSingle,
  getCmsUrl,
} from "@/lib/strapi-client";
import { cache } from "react";
import type { Product } from "@/data/mock";
import {
  mapStrapiAboutSections,
  mapStrapiCase,
  mapStrapiContactInfo,
  mapStrapiDownload,
  mapStrapiProduct,
  mapStrapiQR,
  mapStrapiSalesContact,
  mapStrapiScene,
} from "@/lib/strapi-mapper";

function isMockMode(): boolean {
  return shouldUseMockData();
}

const EMPTY_CONTACT: ContactInfo = {
  company: { zh: "", en: "" },
  phones: [],
  email: "",
  address: { zh: "", en: "" },
  mapQuery: "",
  mapDisplayAddress: { zh: "", en: "" },
  footerIntro: { zh: "", en: "" },
};

const EMPTY_GLOBAL_SETTING = {
  logo: undefined as string | undefined,
  footerCopyright: { zh: "", en: "" },
  homeFeaturedProductIds: [] as number[],
  homeFeaturedCase: undefined as (typeof globalSettingDefault)["homeFeaturedCase"],
};

const EMPTY_ABOUT_IMAGES: AboutImages = {
  brandIntro: "",
  origin: "",
  system: ["", "", ""] as AboutImages["system"],
  focus: "",
  dsp: ["", "", ""] as AboutImages["dsp"],
};

const EMPTY_SMART_SELECTION = {
  title: { zh: "", en: "" },
  subtitle: { zh: "", en: "" },
  buttons: {
    generate: { zh: "", en: "" },
    regenerate: { zh: "", en: "" },
    copy: { zh: "", en: "" },
    contact: { zh: "", en: "" },
  },
};

function resolveSiteMarket(): "cn" | "global" | "all" {
  const envMarket =
    (process.env.SITE_MARKET || process.env.NEXT_PUBLIC_SITE_MARKET || "all").toLowerCase();
  if (envMarket === "cn" || envMarket === "global") return envMarket;
  return "all";
}

function withMarketFilter(query: string): string {
  const market = resolveSiteMarket();
  if (market === "all") return query;
  const sep = query.includes("?") ? "&" : "?";
  return `${query}${sep}filters[$or][0][market][$eq]=${market}&filters[$or][1][market][$eq]=all&filters[$or][2][market][$null]=true`;
}

function filterByMarket<T extends { market?: "cn" | "global" | "all" }>(items: T[]): T[] {
  const market = resolveSiteMarket();
  if (market === "all") return items;
  return items.filter((item) => !item.market || item.market === "all" || item.market === market);
}

function logStrapiEmpty(collection: string) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[fetchCMS] Strapi 返回空 ${collection}，生产环境不回退 Mock`);
  }
}

function strapiUrl(path: string): string {
  return `${getCmsUrl()}${path}`;
}

const CASES_QUERY =
  "/cases?populate[image]=true&populate[gallery]=true&sort[0]=legacyId:asc&pagination[pageSize]=100";
const QR_QUERY =
  "/qr-codes?populate[image]=true&sort[0]=sortOrder:asc";
const SALES_CONTACTS_QUERY =
  "/sales-contacts?filters[enabled][$eq]=true&populate[qrImage]=true&sort[0]=sortOrder:asc&pagination[pageSize]=50&publicationState=live";
const SCENES_QUERY =
  "/scenes?populate[image]=true&sort[0]=sortOrder:asc";
const DOWNLOADS_QUERY =
  "/downloads?populate[cover]=true&populate[file]=true&sort[0]=sortOrder:asc&pagination[pageSize]=100";
const PRODUCTS_QUERY =
  "/products?populate[image]=true&populate[gallery]=true&sort[0]=sortOrder:asc&pagination[pageSize]=100";
const ABOUT_QUERY =
  "/about-sections?populate[image]=true&sort[0]=sortOrder:asc";
const GLOBAL_SETTING_QUERY =
  "/global-setting?populate[logo]=true&populate[homeFeaturedCaseImage]=true";
const SMART_SELECTION_PAGE_QUERY = "/smart-selection-page";
const PRODUCT_SERIES_CONFIG_QUERY =
  "/product-series-configs?sort[0]=sortOrder:asc&pagination[pageSize]=100";

export const getProductSeriesConfig = cache(async function getProductSeriesConfig(): Promise<ProductSeriesConfig> {
  if (isMockMode()) return DEFAULT_PRODUCT_SERIES_CONFIG;

  try {
    const docs = await fetchStrapiCollection<CmsProductSeriesRow>(
      PRODUCT_SERIES_CONFIG_QUERY,
      FRONTEND_REVALIDATE_SECONDS,
      [CMS_FETCH_TAGS.productSeries]
    );
    return buildProductSeriesConfig(docs);
  } catch (e) {
    console.error("[fetchCMS] product-series-config 读取失败，使用默认配置:", e);
    return DEFAULT_PRODUCT_SERIES_CONFIG;
  }
});

const SOCIAL_LINKS_QUERY =
  "/social-links?populate[qrImage]=true&sort[0]=sortOrder:asc";

async function fetchProductsMapped(
  revalidate: number | false
): Promise<Product[]> {
  const cmsUrl = getCmsUrl();
  const fetchMapped = async (query: string) => {
    const docs = await fetchStrapiCollection<Parameters<typeof mapStrapiProduct>[0]>(
      query,
      revalidate,
      [CMS_FETCH_TAGS.products]
    );
    if (!docs.length) return null;
    return docs.map((doc, index) => mapStrapiProduct(doc, cmsUrl, index));
  };

  const withMarket = await fetchMapped(withMarketFilter(PRODUCTS_QUERY));
  if (withMarket?.length) return withMarket;

  const withoutMarket = await fetchMapped(PRODUCTS_QUERY);
  if (withoutMarket?.length) return withoutMarket;

  logStrapiEmpty("products");
  return [];
}

export const getProducts = cache(async function getProducts() {
  if (isMockMode()) return filterByMarket(products);

  return withLastKnownGood(
    "products",
    strapiUrl(PRODUCTS_QUERY),
    () => fetchProductsMapped(FRONTEND_REVALIDATE_SECONDS),
    []
  );
});

/** 后台保存后强制拉新并写入 LKG（绕过 Next fetch Data Cache） */
export async function refreshProductsLkgFromStrapi(): Promise<Product[]> {
  if (isMockMode()) return filterByMarket(products);

  const list = await fetchProductsMapped(false);
  writeLkgCache("products", list, strapiUrl(PRODUCTS_QUERY));
  return list;
}

export async function getProductById(id: number) {
  const list = await getProducts();
  return list.find((p) => p.id === id) ?? null;
}

export const getCases = cache(async function getCases() {
  if (isMockMode()) {
    return sortCases(applyCaseImages(filterByMarket(cases)));
  }

  const cmsUrl = getCmsUrl();
  return withLastKnownGood(
    "cases",
    strapiUrl(CASES_QUERY),
    async () => {
      const fetchMapped = async (query: string) => {
        const docs = await fetchStrapiCollection<Parameters<typeof mapStrapiCase>[0]>(query);
        if (!docs.length) return null;
        return sortCases(docs.map((doc) => mapStrapiCase(doc, cmsUrl)));
      };

      const withMarket = await fetchMapped(withMarketFilter(CASES_QUERY));
      if (withMarket?.length) return withMarket;

      const withoutMarket = await fetchMapped(CASES_QUERY);
      if (withoutMarket?.length) return withoutMarket;

      logStrapiEmpty("cases");
      return [];
    },
    []
  );
});

export async function getCaseById(id: number) {
  const list = await getCases();
  return list.find((c) => c.id === id) ?? null;
}

export const getDownloads = cache(async function getDownloads() {
  if (isMockMode()) return filterByMarket(downloads);

  const cmsUrl = getCmsUrl();
  return withLastKnownGood(
    "downloads",
    strapiUrl(DOWNLOADS_QUERY),
    async () => {
      const fetchMapped = async (query: string) => {
        const docs = await fetchStrapiCollection<Parameters<typeof mapStrapiDownload>[0]>(query);
        if (!docs.length) return null;
        return docs.map((doc, index) => mapStrapiDownload(doc, cmsUrl, index));
      };

      const withMarket = await fetchMapped(withMarketFilter(DOWNLOADS_QUERY));
      if (withMarket?.length) return withMarket;

      const withoutMarket = await fetchMapped(DOWNLOADS_QUERY);
      if (withoutMarket?.length) return withoutMarket;

      logStrapiEmpty("downloads");
      return [];
    },
    []
  );
});

export async function getScenes() {
  if (isMockMode()) return scenes;

  const cmsUrl = getCmsUrl();
  return withLastKnownGood(
    "scenes",
    strapiUrl(SCENES_QUERY),
    async () => {
      const docs = await fetchStrapiCollection<Parameters<typeof mapStrapiScene>[0]>(SCENES_QUERY);
      if (docs.length) {
        return docs.map((doc, index) => mapStrapiScene(doc, cmsUrl, index));
      }
      logStrapiEmpty("scenes");
      return [];
    },
    []
  );
}

export async function getQRCodes() {
  if (isMockMode()) return qrCodes;

  try {
    const cmsUrl = getCmsUrl();
    const docs = await fetchStrapiCollection<Parameters<typeof mapStrapiQR>[0]>(QR_QUERY);
    if (docs.length) {
      return docs.map((doc, index) => mapStrapiQR(doc, cmsUrl, index));
    }
    logStrapiEmpty("qr-codes");
    return [];
  } catch (e) {
    console.error("[fetchCMS] qr-codes 读取失败:", e);
    return [];
  }
}

export const getSalesContacts = cache(async function getSalesContacts() {
  const fallback = fallbackSalesContacts();
  if (isMockMode()) return fallback;

  try {
    const cmsUrl = getCmsUrl();
    const docs = await fetchStrapiCollection<Parameters<typeof mapStrapiSalesContact>[0]>(
      SALES_CONTACTS_QUERY,
      false
    );

    const mapped = docs
      .filter((doc) => doc.enabled !== false)
      .map((doc, index) => mapStrapiSalesContact(doc, cmsUrl, index))
      .filter((item) => Boolean(item.qrImage))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return mapped;
  } catch (e) {
    console.error("[fetchCMS] sales-contacts 读取失败，使用 fallback:", e);
    return fallback;
  }
});

export async function getAboutImages(): Promise<AboutImages> {
  if (isMockMode()) return aboutImages;

  const cmsUrl = getCmsUrl();
  return withLastKnownGood(
    "about",
    strapiUrl(ABOUT_QUERY),
    async () => {
      const docs = await fetchStrapiCollection<Parameters<typeof mapStrapiAboutSections>[0][number]>(
        ABOUT_QUERY
      );
      if (docs.length) {
        return mapStrapiAboutSections(docs, cmsUrl, EMPTY_ABOUT_IMAGES);
      }
      return { ...EMPTY_ABOUT_IMAGES };
    },
    { ...EMPTY_ABOUT_IMAGES }
  );
}

export const getContactInfo = cache(async function getContactInfo() {
  if (isMockMode()) return contactInfo;

  const cmsUrl = getCmsUrl();
  return withLastKnownGood(
    "contact",
    strapiUrl("/contact-info"),
    async () => {
      const doc = await fetchStrapiSingle<Parameters<typeof mapStrapiContactInfo>[0]>(
        "/contact-info"
      );
      if (doc) {
        return mapStrapiContactInfo(doc, EMPTY_CONTACT, cmsUrl);
      }
      return { ...EMPTY_CONTACT };
    },
    { ...EMPTY_CONTACT }
  );
});

export async function getGlobalSetting() {
  if (isMockMode()) return globalSettingDefault;

  const fallback = EMPTY_GLOBAL_SETTING;
  return withLastKnownGood(
    "globalSetting",
    strapiUrl(GLOBAL_SETTING_QUERY),
    async () => {
      type GlobalSettingDoc = {
        logo?: { url?: string } | null;
        footerCopyrightZh?: string | null;
        footerCopyrightEn?: string | null;
        homeFeaturedProductAId?: number | null;
        homeFeaturedProductBId?: number | null;
        homeFeaturedCaseId?: number | null;
        homeFeaturedCaseTitleZh?: string | null;
        homeFeaturedCaseTitleEn?: string | null;
        homeFeaturedCaseDescZh?: string | null;
        homeFeaturedCaseDescEn?: string | null;
        homeFeaturedCaseImage?: { url?: string } | null;
      };
      const doc = await fetchStrapiSingle<GlobalSettingDoc>(GLOBAL_SETTING_QUERY);
      if (!doc) {
        return { ...fallback };
      }

      type HomeFeaturedCaseSource = Pick<
        GlobalSettingDoc,
        | "homeFeaturedCaseId"
        | "homeFeaturedCaseTitleZh"
        | "homeFeaturedCaseTitleEn"
        | "homeFeaturedCaseDescZh"
        | "homeFeaturedCaseDescEn"
        | "homeFeaturedCaseImage"
      >;

      let caseSource: HomeFeaturedCaseSource = doc;
      const hasGlobalCase =
        doc.homeFeaturedCaseId != null ||
        doc.homeFeaturedCaseTitleZh ||
        doc.homeFeaturedCaseTitleEn ||
        doc.homeFeaturedCaseImage;

      if (!hasGlobalCase) {
        const contactDoc = await fetchStrapiSingle<HomeFeaturedCaseSource>(
          "/contact-info?populate[homeFeaturedCaseImage]=true"
        );
        if (
          contactDoc &&
          (contactDoc.homeFeaturedCaseId != null ||
            contactDoc.homeFeaturedCaseTitleZh ||
            contactDoc.homeFeaturedCaseTitleEn ||
            contactDoc.homeFeaturedCaseImage)
        ) {
          caseSource = contactDoc;
        }
      }

      return {
        logo: resolveBrowserMediaUrl(doc.logo?.url ?? "") || fallback.logo,
        footerCopyright: {
          zh: doc.footerCopyrightZh || fallback.footerCopyright.zh,
          en: doc.footerCopyrightEn || fallback.footerCopyright.en,
        },
        homeFeaturedProductIds: [
          doc.homeFeaturedProductAId ?? fallback.homeFeaturedProductIds[0],
          doc.homeFeaturedProductBId ?? fallback.homeFeaturedProductIds[1],
        ].filter((id): id is number => typeof id === "number" && id > 0),
        homeFeaturedCase:
          caseSource.homeFeaturedCaseId != null ||
          caseSource.homeFeaturedCaseTitleZh ||
          caseSource.homeFeaturedCaseTitleEn ||
          caseSource.homeFeaturedCaseImage
            ? {
                caseId: caseSource.homeFeaturedCaseId ?? 0,
                title: {
                  zh: caseSource.homeFeaturedCaseTitleZh ?? "",
                  en: caseSource.homeFeaturedCaseTitleEn ?? "",
                },
                desc: {
                  zh: caseSource.homeFeaturedCaseDescZh ?? "",
                  en: caseSource.homeFeaturedCaseDescEn ?? "",
                },
                image: resolveBrowserMediaUrl(caseSource.homeFeaturedCaseImage?.url ?? ""),
              }
            : fallback.homeFeaturedCase,
      };
    },
    { ...fallback }
  );
}

export async function getSmartSelectionPage() {
  if (isMockMode()) return smartSelectionPageDefault;

  try {
    type SmartSelectionPageDoc = {
      titleZh?: string | null;
      titleEn?: string | null;
      subtitleZh?: string | null;
      subtitleEn?: string | null;
      generateButtonZh?: string | null;
      generateButtonEn?: string | null;
      regenerateButtonZh?: string | null;
      regenerateButtonEn?: string | null;
      copyButtonZh?: string | null;
      copyButtonEn?: string | null;
      contactButtonZh?: string | null;
      contactButtonEn?: string | null;
    };

    const doc = await fetchStrapiSingle<SmartSelectionPageDoc>(SMART_SELECTION_PAGE_QUERY);
    if (!doc) return { ...EMPTY_SMART_SELECTION };

    return {
      title: {
        zh: doc.titleZh || EMPTY_SMART_SELECTION.title.zh,
        en: doc.titleEn || EMPTY_SMART_SELECTION.title.en,
      },
      subtitle: {
        zh: doc.subtitleZh || EMPTY_SMART_SELECTION.subtitle.zh,
        en: doc.subtitleEn || EMPTY_SMART_SELECTION.subtitle.en,
      },
      buttons: {
        generate: {
          zh: doc.generateButtonZh || EMPTY_SMART_SELECTION.buttons.generate.zh,
          en: doc.generateButtonEn || EMPTY_SMART_SELECTION.buttons.generate.en,
        },
        regenerate: {
          zh: doc.regenerateButtonZh || EMPTY_SMART_SELECTION.buttons.regenerate.zh,
          en: doc.regenerateButtonEn || EMPTY_SMART_SELECTION.buttons.regenerate.en,
        },
        copy: {
          zh: doc.copyButtonZh || EMPTY_SMART_SELECTION.buttons.copy.zh,
          en: doc.copyButtonEn || EMPTY_SMART_SELECTION.buttons.copy.en,
        },
        contact: {
          zh: doc.contactButtonZh || EMPTY_SMART_SELECTION.buttons.contact.zh,
          en: doc.contactButtonEn || EMPTY_SMART_SELECTION.buttons.contact.en,
        },
      },
    };
  } catch (e) {
    console.error("[fetchCMS] smart-selection-page 读取失败:", e);
    return { ...EMPTY_SMART_SELECTION };
  }
}

export async function getSocialLinks() {
  if (isMockMode()) return socialLinksDefault;

  try {
    type SocialLinkDoc = {
      platformKey: "wechat" | "douyin" | "channels";
      labelZh?: string | null;
      labelEn?: string | null;
      url?: string | null;
      qrImage?: { url?: string } | null;
      sortOrder?: number | null;
      enabled?: boolean | null;
    };
    const docs = await fetchStrapiCollection<SocialLinkDoc>(SOCIAL_LINKS_QUERY);
    if (!docs.length) return [];

    const cmsUrl = getCmsUrl();
    return docs.map((doc, index) => ({
      platformKey: doc.platformKey,
      label: {
        zh: doc.labelZh || doc.platformKey,
        en: doc.labelEn || doc.platformKey,
      },
      url: doc.url || "",
      qrImage:
        resolveBrowserMediaUrl(
          resolveCmsAssetUrl(pickListMediaPath({ image: doc.qrImage }))
        ) || undefined,
      sortOrder: doc.sortOrder ?? index + 1,
      enabled: doc.enabled !== false,
    }));
  } catch (e) {
    console.error("[fetchCMS] social-links 读取失败:", e);
    return [];
  }
}
