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

export type LeadDashboard = {
  total: number;
  byStatus: Record<string, number>;
  qualifiedRate: number;
  winRate: number;
  topSources: Array<{ source: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
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

export async function getLeadDashboard(): Promise<LeadDashboard> {
  const token = process.env.STRAPI_API_TOKEN;
  if (!token) {
    return {
      total: 0,
      byStatus: {},
      qualifiedRate: 0,
      winRate: 0,
      topSources: [],
      topCountries: [],
    };
  }

  const json = await fetchStrapiWithToken<{
    data?: Array<{
      status?: string;
      utmSource?: string;
      country?: string;
    }>;
  }>("/leads?sort[0]=createdAt:desc&pagination[pageSize]=500", token);

  const rows = json?.data ?? [];
  const byStatus: Record<string, number> = {};
  const sourceCount = new Map<string, number>();
  const countryCount = new Map<string, number>();

  for (const row of rows) {
    const status = row.status || "new";
    byStatus[status] = (byStatus[status] ?? 0) + 1;

    const source = (row.utmSource || "direct").trim() || "direct";
    sourceCount.set(source, (sourceCount.get(source) ?? 0) + 1);

    const country = (row.country || "unknown").trim() || "unknown";
    countryCount.set(country, (countryCount.get(country) ?? 0) + 1);
  }

  const total = rows.length;
  const qualified = (byStatus.qualified ?? 0) + (byStatus.quoted ?? 0) + (byStatus.won ?? 0);
  const won = byStatus.won ?? 0;

  return {
    total,
    byStatus,
    qualifiedRate: total > 0 ? Math.round((qualified / total) * 1000) / 10 : 0,
    winRate: total > 0 ? Math.round((won / total) * 1000) / 10 : 0,
    topSources: Array.from(sourceCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, count]) => ({ source, count })),
    topCountries: Array.from(countryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ country, count })),
  };
}
