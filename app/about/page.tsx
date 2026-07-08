import AboutContent from "./AboutContent";
import SiteFooter from "@/components/SiteFooter";
import { getAboutImages } from "@/lib/fetchCMS";
import { PAGE_SEO, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(PAGE_SEO.about, "/about");

export default async function AboutPage() {
  const images = await getAboutImages();

  return (
    <main className="min-h-screen">
      <AboutContent images={images} />
      <SiteFooter />
    </main>
  );
}
