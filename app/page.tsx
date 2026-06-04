import Hero from "@/components/Hero";
import {
  HomeCasesPreview,
  HomeProductsPreview,
  HomeScenes,
} from "@/components/HomeSections";
import SiteFooter from "@/components/SiteFooter";
import { getCases, getProducts, getScenes } from "@/lib/fetchCMS";

export default async function HomePage() {
  const [products, scenes, cases] = await Promise.all([
    getProducts(),
    getScenes(),
    getCases(),
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
