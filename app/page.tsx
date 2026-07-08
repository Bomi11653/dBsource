import Hero from "@/components/Hero";
import {
  HomeCasesPreview,
  HomeProductsPreview,
  HomeScenes,
} from "@/components/HomeSections";
import SiteFooter from "@/components/SiteFooter";
import { getCases, getContactInfo, getProducts, getScenes } from "@/lib/fetchCMS";
import { PAGE_SEO, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(PAGE_SEO.home, "/", undefined, { absoluteTitle: true });

export default async function HomePage() {
  const [scenes, cases, products, contactInfo] = await Promise.all([
    getScenes(),
    getCases(),
    getProducts(),
    getContactInfo(),
  ]);

  return (
    <main>
      <Hero />
      <HomeScenes scenes={scenes} />
      <HomeProductsPreview products={products} />
      <HomeCasesPreview cases={cases} featuredCaseOverride={contactInfo.homeFeaturedCase} />
      <SiteFooter />
    </main>
  );
}
