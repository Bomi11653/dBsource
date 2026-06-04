import DownloadsContent from "./DownloadsContent";
import SiteFooter from "@/components/SiteFooter";
import { getDownloads } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "下载中心",
  "调音软件、系统配置工具与产品画册下载"
);

export default async function DownloadsPage() {
  const downloads = await getDownloads();
  return (
    <main className="pt-24 min-h-screen">
      <DownloadsContent items={downloads} />
      <SiteFooter />
    </main>
  );
}
