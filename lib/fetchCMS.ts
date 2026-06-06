import {
  cases,
  downloads,
  products,
  qrCodes,
  scenes,
} from "@/data/mock";
import { aboutImages, type AboutImages } from "@/data/about";
import { applyCaseImages, sortCases } from "@/lib/cases";
import { fetchStrapiCollection, getCmsUrl } from "@/lib/strapi-client";
import {
  mapStrapiAboutSections,
  mapStrapiCase,
  mapStrapiDownload,
  mapStrapiProduct,
  mapStrapiQR,
  mapStrapiScene,
} from "@/lib/strapi-mapper";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

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
  if (USE_MOCK) return products;

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
  if (USE_MOCK) {
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
  if (USE_MOCK) return downloads;

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
  if (USE_MOCK) return scenes;

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
  if (USE_MOCK) return qrCodes;

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
  if (USE_MOCK) return aboutImages;

  const cmsUrl = getCmsUrl();
  const docs = await fetchStrapiCollection<Parameters<typeof mapStrapiAboutSections>[0][number]>(
    ABOUT_QUERY
  );

  if (docs?.length) {
    return mapStrapiAboutSections(docs, cmsUrl, aboutImages);
  }

  return aboutImages;
}
