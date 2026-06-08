import Hero from "@/components/Hero";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "dBsource | 专业音响品牌官网",
  "dBsource 专业音响系统 — 产品中心、工程案例、软件下载与工程服务。东莞新声电子科技有限公司。",
  "/"
);
import {
  HomeCasesPreview,
  HomeProductsPreview,
  HomeScenes,
} from "@/components/HomeSections";
import SiteFooter from "@/components/SiteFooter";
import { getCases, getProducts, getScenes } from "@/lib/fetchCMS";

export default async function HomePage() {
  const [scenes, cases, products] = await Promise.all([
    getScenes(),
    getCases(),
    getProducts(),
  ]);

  return (
    <main>
      <Hero />
      <HomeScenes scenes={scenes} />
      <HomeProductsPreview products={products} />
      <HomeCasesPreview cases={cases} />
      <SiteFooter />
    </main>
  );
}
