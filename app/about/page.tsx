import AboutContent from "./AboutContent";
import SiteFooter from "@/components/SiteFooter";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "关于我们",
  "dBsource 品牌起源、系统解决方案、Focus 声学软件与 unit48 DSP 硬件"
);

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <AboutContent />
      <SiteFooter />
    </main>
  );
}
