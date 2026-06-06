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

const CMS_URL = process.env.CMS_URL || "http://localhost:1337";

export async function submitContactLead(payload: {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  message: string;
}) {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false") {
    console.info("[Mock Lead]", payload);
    return { ok: true };
  }
  const res = await fetch(`${CMS_URL}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  });
  return { ok: res.ok };
}
