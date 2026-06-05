import {
  cases,
  downloads,
  products,
  qrCodes,
  scenes,
} from "@/data/mock";

const CMS_URL = process.env.CMS_URL || "http://localhost:1337";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

async function fetchStrapi<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${CMS_URL}/api${path}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as T;
  } catch {
    return null;
  }
}

export async function getProducts() {
  if (USE_MOCK) return products;
  return (await fetchStrapi<typeof products>("/products?populate=*")) ?? products;
}

export async function getProductById(id: number) {
  const list = await getProducts();
  return list.find((p) => p.id === id) ?? null;
}

export async function getCases() {
  if (USE_MOCK) return cases;
  return (await fetchStrapi<typeof cases>("/cases?populate=*")) ?? cases;
}

export async function getCaseById(id: number) {
  const list = await getCases();
  return list.find((c) => c.id === id) ?? null;
}

export async function getDownloads() {
  if (USE_MOCK) return downloads;
  return (await fetchStrapi<typeof downloads>("/downloads?populate=*")) ?? downloads;
}

export async function getScenes() {
  if (USE_MOCK) return scenes;
  return (await fetchStrapi<typeof scenes>("/scenes?populate=*")) ?? scenes;
}

export async function getQRCodes() {
  if (USE_MOCK) return qrCodes;
  return (await fetchStrapi<typeof qrCodes>("/qr-codes?populate=*")) ?? qrCodes;
}
