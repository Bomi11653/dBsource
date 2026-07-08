import { MetadataRoute } from "next";
import { getCases, getProducts } from "@/lib/fetchCMS";
import { siteConfig } from "@/lib/seo";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/products", priority: 0.9, changeFrequency: "weekly" },
  { path: "/cases", priority: 0.9, changeFrequency: "weekly" },
  { path: "/downloads", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.85, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const products = await getProducts();
  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/products/${p.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const caseList = await getCases();
  const caseEntries: MetadataRoute.Sitemap = caseList.map((c) => ({
    url: `${base}/cases/${c.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticEntries, ...productEntries, ...caseEntries];
}
