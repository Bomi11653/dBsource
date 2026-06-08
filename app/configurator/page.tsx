import ConfiguratorContent from "./ConfiguratorContent";
import SiteFooter from "@/components/SiteFooter";
import { getCases, getProducts } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "智能选型",
  "Live House、体育馆、会议礼堂扩声系统免费选型工具",
  "/configurator"
);

export default async function ConfiguratorPage() {
  const [products, cases] = await Promise.all([getProducts(), getCases()]);

  return (
    <main className="pt-24 sm:pt-28 min-h-screen bg-black text-white">
      <ConfiguratorContent products={products} cases={cases} />
      <SiteFooter />
    </main>
  );
}
