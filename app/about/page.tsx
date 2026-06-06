import AboutContent from "./AboutContent";
import SiteFooter from "@/components/SiteFooter";
import { getAboutImages } from "@/lib/fetchCMS";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "关于我们",
  "dBsource 品牌起源、系统解决方案、Focus 声学软件与 unit48 DSP 硬件"
);

export default async function AboutPage() {
  const images = await getAboutImages();

  return (
    <main className="min-h-screen">
      <AboutContent images={images} />
      <SiteFooter />
    </main>
  );
}
