import ContactContent from "./ContactContent";
import SiteFooter from "@/components/SiteFooter";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "联系我们",
  "联系 dBsource — 产品咨询、工程合作。东莞新声电子科技有限公司。",
  "/contact"
);

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <ContactContent />
      <SiteFooter />
    </main>
  );
}
