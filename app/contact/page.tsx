import ContactContent from "./ContactContent";
import SiteFooter from "@/components/SiteFooter";
import { getQRCodes } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "联系我们",
  "联系 dBsource — 产品咨询、工程合作。东莞新声电子科技有限公司。",
  "/contact"
);

export default async function ContactPage() {
  const qrItems = await getQRCodes();

  return (
    <main className="min-h-screen">
      <ContactContent qrItems={qrItems} />
      <SiteFooter />
    </main>
  );
}
