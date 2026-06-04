import CasesScrollStory from "@/components/CasesScrollStory";
import SiteFooter from "@/components/SiteFooter";
import { getCases } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "工程案例",
  "体育场、Live House、会展中心等专业音响工程案例"
);

export default async function CasesPage() {
  const cases = await getCases();
  return (
    <main className="bg-black">
      <CasesScrollStory cases={cases} />
      <SiteFooter />
    </main>
  );
}
