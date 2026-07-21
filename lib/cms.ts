/**
 * CMS 统一 API — 替换 STRAPI_URL 即可接 Strapi / Sanity
 */
export {
  getProducts,
  getProductById,
  getCases,
  getCaseById,
  getDownloads,
  getScenes,
  getQRCodes,
  getSalesContacts,
  getAboutImages,
  getContactInfo,
  getGlobalSetting,
} from "./fetchCMS";

export { getContactModuleData } from "./contact-module-data";

export { PRODUCTS_PAGE_SIZE } from "@/data/mock";
export type { SalesContactItem } from "@/data/sales-contacts";
export type {
  Product,
  ProductCategory,
  ProductSeriesGroup,
  CaseItem,
  CaseType,
  DownloadItem,
  SceneItem,
  QRItem,
  GlobalSettingData,
} from "@/data/mock";

import { postStrapiDocument } from "./strapi-client";

export async function submitContactLead(payload: {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  message: string;
  product?: string;
  intentScore?: number;
  intentTag?: string;
  language?: string;
  country?: string;
  market?: "cn" | "global" | "all";
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  landingPage?: string;
  referrer?: string;
}) {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
  if (useMock) {
    console.info("[Mock Lead]", payload);
    return { ok: true };
  }

  const ok = await postStrapiDocument("leads", {
    name: payload.name,
    phone: payload.phone ?? "",
    email: payload.email ?? "",
    company: payload.company ?? "",
    product: payload.product ?? "",
    intentScore: payload.intentScore ?? 0,
    intentTag: payload.intentTag ?? "",
    language: payload.language ?? "",
    country: payload.country ?? "",
    market: payload.market ?? "all",
    utmSource: payload.utmSource ?? "",
    utmMedium: payload.utmMedium ?? "",
    utmCampaign: payload.utmCampaign ?? "",
    utmTerm: payload.utmTerm ?? "",
    utmContent: payload.utmContent ?? "",
    landingPage: payload.landingPage ?? "",
    referrer: payload.referrer ?? "",
    message: payload.message,
    status: "new",
  });

  return { ok };
}
