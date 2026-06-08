import type { AdminStats } from "./admin-sections";
import { fetchStrapiWithToken, getCmsUrl } from "./strapi-client";

async function countCollection(endpoint: string): Promise<number> {
  try {
    const url = `${getCmsUrl()}/api${endpoint}&pagination[pageSize]=1&fields[0]=id`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return 0;
    const json = (await res.json()) as {
      data?: unknown[];
      meta?: { pagination?: { total?: number } };
    };
    return json.meta?.pagination?.total ?? json.data?.length ?? 0;
  } catch {
    return 0;
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  const [products, cases, downloads, scenes, qrCodes, aboutSections, productSeries] =
    await Promise.all([
    countCollection("/products?"),
    countCollection("/cases?"),
    countCollection("/downloads?"),
    countCollection("/scenes?"),
    countCollection("/qr-codes?"),
    countCollection("/about-sections?"),
    countCollection("/product-series-configs?"),
  ]);

  let leads = 0;
  const token = process.env.STRAPI_API_TOKEN;
  if (token) {
    const json = await fetchStrapiWithToken<{ data?: unknown[] }>(
      "/leads?sort[0]=createdAt:desc&pagination[pageSize]=100",
      token
    );
    leads = json?.data?.length ?? 0;
  }

  return { products, cases, downloads, scenes, qrCodes, aboutSections, leads, productSeries };
}

export type LeadRow = {
  id: number;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  message: string;
  status: string;
  createdAt?: string;
};

export async function getAdminLeads(): Promise<LeadRow[]> {
  const token = process.env.STRAPI_API_TOKEN;
  if (!token) return [];

  const json = await fetchStrapiWithToken<{
    data?: Array<{
      id: number;
      name: string;
      company?: string;
      email?: string;
      phone?: string;
      message: string;
      status: string;
      createdAt?: string;
    }>;
  }>("/leads?sort[0]=createdAt:desc&pagination[pageSize]=50", token);

  return (json?.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt,
  }));
}
