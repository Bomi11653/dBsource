import ContactContent from "./ContactContent";
import SiteFooter from "@/components/SiteFooter";
import { getContactInfo } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";
import { Suspense } from "react";

export const metadata = pageMetadata(
  "联系我们",
  "联系 dBsource — 产品咨询、工程合作。东莞新声电子科技有限公司。",
  "/contact"
);

export default async function ContactPage() {
  const contact = await getContactInfo();

  return (
    <main className="min-h-screen">
      <Suspense fallback={<div className="pt-28 page-x text-gray-500">Loading…</div>}>
        <ContactContent contact={contact} />
      </Suspense>
      <SiteFooter />
    </main>
  );
}
