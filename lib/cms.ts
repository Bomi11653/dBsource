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
  getAboutImages,
  getContactInfo,
} from "./fetchCMS";

export { PRODUCTS_PAGE_SIZE } from "@/data/mock";
export type {
  Product,
  ProductCategory,
  ProductSeriesGroup,
  CaseItem,
  CaseType,
  DownloadItem,
  SceneItem,
  QRItem,
} from "@/data/mock";

import { postStrapiDocument } from "./strapi-client";

export async function submitContactLead(payload: {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  message: string;
  product?: string;
}) {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";
  if (useMock) {
    console.info("[Mock Lead]", payload);
    return { ok: true };
  }

  const ok = await postStrapiDocument("leads", {
    name: payload.name,
    phone: payload.phone ?? "",
    email: payload.email ?? "",
    company: payload.company ?? "",
    message: payload.message,
    status: "new",
  });

  return { ok };
}
