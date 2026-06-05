import { MetadataRoute } from "next";
import { getCases, getProducts } from "@/lib/fetchCMS";
import { siteConfig } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const staticRoutes = ["", "/about", "/products", "/cases", "/downloads", "/contact"];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));

  const products = await getProducts();
  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/products/${p.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const caseList = await getCases();
  const caseEntries: MetadataRoute.Sitemap = caseList.map((c) => ({
    url: `${base}/cases/${c.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  return [...staticEntries, ...productEntries, ...caseEntries];
}
