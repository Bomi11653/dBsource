import Hero from "@/components/Hero";
import {
  HomeCasesPreview,
  HomeProductsPreview,
  HomeScenes,
} from "@/components/HomeSections";
import SiteFooter from "@/components/SiteFooter";
import { getCases, getScenes } from "@/lib/fetchCMS";

export default async function HomePage() {
  const [scenes, cases] = await Promise.all([getScenes(), getCases()]);

  return (
    <main>
      <Hero />
      <HomeScenes scenes={scenes} />
      <HomeProductsPreview />
      <HomeCasesPreview cases={cases} />
      <SiteFooter />
    </main>
  );
}
