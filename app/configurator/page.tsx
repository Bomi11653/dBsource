import ConfiguratorContent from "./ConfiguratorContent";
import SiteFooter from "@/components/SiteFooter";
import { getCases, getProducts } from "@/lib/cms";
import { getSmartSelectionPage } from "@/lib/fetchCMS";
import { PAGE_SEO, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(PAGE_SEO.configurator, "/configurator");

export default async function ConfiguratorPage() {
  const [products, cases, cmsCopy] = await Promise.all([
    getProducts(),
    getCases(),
    getSmartSelectionPage(),
  ]);

  return (
    <main className="pt-24 sm:pt-28 min-h-screen bg-black text-white">
      <ConfiguratorContent products={products} cases={cases} cmsCopy={cmsCopy} />
      <SiteFooter />
    </main>
  );
}
