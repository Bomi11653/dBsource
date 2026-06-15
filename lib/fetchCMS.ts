function toMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  const base = getCmsUrl();
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

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
} from "@/data/mock";
import { aboutImages, type AboutImages } from "@/data/about";
import { applyCaseImages, sortCases } from "@/lib/cases";
import { isCmsAvailable } from "@/lib/cms-health";
import { fetchStrapiCollection, fetchStrapiSingle, getCmsUrl } from "@/lib/strapi-client";
import {
  mapStrapiAboutSections,
  mapStrapiCase,
  mapStrapiContactInfo,
  mapStrapiDownload,
  mapStrapiProduct,
  mapStrapiQR,
  mapStrapiScene,
} from "@/lib/strapi-mapper";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

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

async function preferMockData(): Promise<boolean> {
  if (USE_MOCK) return true;
  return !(await isCmsAvailable());
}

const CASES_QUERY =
  "/cases?populate[image][fields][0]=url&populate[gallery][fields][0]=url&sort[0]=sortOrder:asc";
const QR_QUERY =
  "/qr-codes?populate[image][fields][0]=url&sort[0]=sortOrder:asc";
const SCENES_QUERY =
  "/scenes?populate[image][fields][0]=url&sort[0]=sortOrder:asc";
const DOWNLOADS_QUERY =
  "/downloads?populate[cover][fields][0]=url&populate[file][fields][0]=url&populate[file][fields][1]=name&populate[file][fields][2]=size&sort[0]=sortOrder:asc";
const PRODUCTS_QUERY =
  "/products?populate[image][fields][0]=url&populate[gallery][fields][0]=url&sort[0]=sortOrder:asc&pagination[pageSize]=100";
const ABOUT_QUERY =
  "/about-sections?populate[image][fields][0]=url&sort[0]=sortOrder:asc";
const GLOBAL_SETTING_QUERY =
  "/global-setting?populate[logo][fields][0]=url&populate[homeFeaturedCaseImage][fields][0]=url";
const SMART_SELECTION_PAGE_QUERY = "/smart-selection-page";
const SOCIAL_LINKS_QUERY =
  "/social-links?populate[qrImage][fields][0]=url&sort[0]=sortOrder:asc";

export async function getProducts() {
  if (await preferMockData()) return filterByMarket(products);

  const cmsUrl = getCmsUrl();
  const docs = await fetchStrapiCollection<Parameters<typeof mapStrapiProduct>[0]>(
    withMarketFilter(PRODUCTS_QUERY)
  );

  if (docs?.length) {
    return docs.map((doc, index) => mapStrapiProduct(doc, cmsUrl, index));
  }

  return filterByMarket(products);
}

export async function getProductById(id: number) {
  const list = await getProducts();
  return list.find((p) => p.id === id) ?? null;
}

export async function getCases() {
  if (await preferMockData()) {
    return sortCases(applyCaseImages(filterByMarket(cases)));
  }

  const cmsUrl = getCmsUrl();
  const docs = await fetchStrapiCollection<Parameters<typeof mapStrapiCase>[0]>(
    withMarketFilter(CASES_QUERY)
  );

  if (docs?.length) {
    return sortCases(docs.map((doc) => mapStrapiCase(doc, cmsUrl)));
  }

  return sortCases(applyCaseImages(filterByMarket(cases)));
}

export async function getCaseById(id: number) {
  const list = await getCases();
  return list.find((c) => c.id === id) ?? null;
}

export async function getDownloads() {
  if (await preferMockData()) return filterByMarket(downloads);

  const cmsUrl = getCmsUrl();
  const docs = await fetchStrapiCollection<Parameters<typeof mapStrapiDownload>[0]>(
    withMarketFilter(DOWNLOADS_QUERY)
  );

  if (docs?.length) {
    return docs.map((doc, index) => mapStrapiDownload(doc, cmsUrl, index));
  }

  return filterByMarket(downloads);
}

export async function getScenes() {
  if (await preferMockData()) return scenes;

  const cmsUrl = getCmsUrl();
  const docs = await fetchStrapiCollection<Parameters<typeof mapStrapiScene>[0]>(
    SCENES_QUERY
  );

  if (docs?.length) {
    return docs.map((doc, index) => mapStrapiScene(doc, cmsUrl, index));
  }

  return scenes;
}

export async function getQRCodes() {
  if (await preferMockData()) return qrCodes;

  const cmsUrl = getCmsUrl();
  const docs = await fetchStrapiCollection<Parameters<typeof mapStrapiQR>[0]>(
    QR_QUERY
  );

  if (docs?.length) {
    return docs.map((doc, index) => mapStrapiQR(doc, cmsUrl, index));
  }

  return qrCodes;
}

export async function getAboutImages(): Promise<AboutImages> {
  if (await preferMockData()) return aboutImages;

  const cmsUrl = getCmsUrl();
  const docs = await fetchStrapiCollection<Parameters<typeof mapStrapiAboutSections>[0][number]>(
    ABOUT_QUERY
  );

  if (docs?.length) {
    return mapStrapiAboutSections(docs, cmsUrl, aboutImages);
  }

  return aboutImages;
}

export async function getContactInfo() {
  if (await preferMockData()) return contactInfo;

  const cmsUrl = getCmsUrl();
  const doc = await fetchStrapiSingle<Parameters<typeof mapStrapiContactInfo>[0]>(
    "/contact-info"
  );

  if (doc) {
    return mapStrapiContactInfo(doc, contactInfo, cmsUrl);
  }

  return contactInfo;
}

export async function getGlobalSetting() {
  if (await preferMockData()) return globalSettingDefault;

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
  if (!doc) return globalSettingDefault;

  return {
    logo: toMediaUrl(doc.logo?.url) || globalSettingDefault.logo,
    footerCopyright: {
      zh: doc.footerCopyrightZh || globalSettingDefault.footerCopyright.zh,
      en: doc.footerCopyrightEn || globalSettingDefault.footerCopyright.en,
    },
    homeFeaturedProductIds: [
      doc.homeFeaturedProductAId ?? globalSettingDefault.homeFeaturedProductIds?.[0] ?? 44,
      doc.homeFeaturedProductBId ?? globalSettingDefault.homeFeaturedProductIds?.[1] ?? 46,
    ],
    homeFeaturedCase: {
      caseId: doc.homeFeaturedCaseId ?? globalSettingDefault.homeFeaturedCase?.caseId ?? 6,
      title:
        doc.homeFeaturedCaseTitleZh || doc.homeFeaturedCaseTitleEn
          ? {
              zh: doc.homeFeaturedCaseTitleZh ?? "",
              en: doc.homeFeaturedCaseTitleEn ?? "",
            }
          : globalSettingDefault.homeFeaturedCase?.title,
      desc:
        doc.homeFeaturedCaseDescZh || doc.homeFeaturedCaseDescEn
          ? {
              zh: doc.homeFeaturedCaseDescZh ?? "",
              en: doc.homeFeaturedCaseDescEn ?? "",
            }
          : globalSettingDefault.homeFeaturedCase?.desc,
      image:
        toMediaUrl(doc.homeFeaturedCaseImage?.url) ||
        globalSettingDefault.homeFeaturedCase?.image,
    },
  };
}

export async function getSmartSelectionPage() {
  if (await preferMockData()) return smartSelectionPageDefault;

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
  if (!doc) return smartSelectionPageDefault;

  return {
    title: {
      zh: doc.titleZh || smartSelectionPageDefault.title.zh,
      en: doc.titleEn || smartSelectionPageDefault.title.en,
    },
    subtitle: {
      zh: doc.subtitleZh || smartSelectionPageDefault.subtitle.zh,
      en: doc.subtitleEn || smartSelectionPageDefault.subtitle.en,
    },
    buttons: {
      generate: {
        zh: doc.generateButtonZh || smartSelectionPageDefault.buttons.generate.zh,
        en: doc.generateButtonEn || smartSelectionPageDefault.buttons.generate.en,
      },
      regenerate: {
        zh: doc.regenerateButtonZh || smartSelectionPageDefault.buttons.regenerate.zh,
        en: doc.regenerateButtonEn || smartSelectionPageDefault.buttons.regenerate.en,
      },
      copy: {
        zh: doc.copyButtonZh || smartSelectionPageDefault.buttons.copy.zh,
        en: doc.copyButtonEn || smartSelectionPageDefault.buttons.copy.en,
      },
      contact: {
        zh: doc.contactButtonZh || smartSelectionPageDefault.buttons.contact.zh,
        en: doc.contactButtonEn || smartSelectionPageDefault.buttons.contact.en,
      },
    },
  };
}

export async function getSocialLinks() {
  if (await preferMockData()) return socialLinksDefault;

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
  if (!docs?.length) return socialLinksDefault;

  return docs.map((doc, index) => ({
    platformKey: doc.platformKey,
    label: {
      zh:
        doc.labelZh ||
        socialLinksDefault.find((x) => x.platformKey === doc.platformKey)?.label.zh ||
        doc.platformKey,
      en:
        doc.labelEn ||
        socialLinksDefault.find((x) => x.platformKey === doc.platformKey)?.label.en ||
        doc.platformKey,
    },
    url:
      doc.url ||
      socialLinksDefault.find((x) => x.platformKey === doc.platformKey)?.url ||
      "",
    qrImage: toMediaUrl(doc.qrImage?.url),
    sortOrder: doc.sortOrder ?? index + 1,
    enabled: doc.enabled !== false,
  }));
}
