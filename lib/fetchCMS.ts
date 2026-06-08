import {
  cases,
  contactInfo,
  downloads,
  products,
  qrCodes,
  scenes,
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

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

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
  "/downloads?populate[cover][fields][0]=url&populate[file][fields][0]=url&sort[0]=sortOrder:asc";
const PRODUCTS_QUERY =
  "/products?populate[image][fields][0]=url&populate[gallery][fields][0]=url&sort[0]=sortOrder:asc&pagination[pageSize]=100";
const ABOUT_QUERY =
  "/about-sections?populate[image][fields][0]=url&sort[0]=sortOrder:asc";

export async function getProducts() {
  if (await preferMockData()) return products;

  const cmsUrl = getCmsUrl();
  const docs = await fetchStrapiCollection<Parameters<typeof mapStrapiProduct>[0]>(
    PRODUCTS_QUERY
  );

  if (docs?.length) {
    return docs.map((doc, index) => mapStrapiProduct(doc, cmsUrl, index));
  }

  return products;
}

export async function getProductById(id: number) {
  const list = await getProducts();
  return list.find((p) => p.id === id) ?? null;
}

export async function getCases() {
  if (await preferMockData()) {
    return sortCases(applyCaseImages(cases));
  }

  const cmsUrl = getCmsUrl();
  const docs = await fetchStrapiCollection<Parameters<typeof mapStrapiCase>[0]>(
    CASES_QUERY
  );

  if (docs?.length) {
    return sortCases(docs.map((doc) => mapStrapiCase(doc, cmsUrl)));
  }

  return sortCases(applyCaseImages(cases));
}

export async function getCaseById(id: number) {
  const list = await getCases();
  return list.find((c) => c.id === id) ?? null;
}

export async function getDownloads() {
  if (await preferMockData()) return downloads;

  const cmsUrl = getCmsUrl();
  const docs = await fetchStrapiCollection<Parameters<typeof mapStrapiDownload>[0]>(
    DOWNLOADS_QUERY
  );

  if (docs?.length) {
    return docs.map((doc, index) => mapStrapiDownload(doc, cmsUrl, index));
  }

  return downloads;
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

  const doc = await fetchStrapiSingle<Parameters<typeof mapStrapiContactInfo>[0]>(
    "/contact-info"
  );

  if (doc) {
    return mapStrapiContactInfo(doc, contactInfo);
  }

  return contactInfo;
}
