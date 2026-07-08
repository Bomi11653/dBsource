import DownloadsContent from "./DownloadsContent";
import SiteFooter from "@/components/SiteFooter";
import { getDownloads } from "@/lib/cms";
import { PAGE_SEO, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(PAGE_SEO.downloads, "/downloads");

export default async function DownloadsPage() {
  const downloads = await getDownloads();
  return (
    <main className="pt-24 min-h-screen-safe">
      <DownloadsContent items={downloads} />
      <SiteFooter />
    </main>
  );
}
