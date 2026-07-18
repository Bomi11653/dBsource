import Hero from "@/components/Hero";
import SiteFooter from "@/components/SiteFooter";
import { PAGE_SEO, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(PAGE_SEO.home, "/", undefined, { absoluteTitle: true });

export default function HomePage() {
  return (
    <>
      <main>
        <Hero />
      </main>
      <SiteFooter />
    </>
  );
}
