import AboutContent from "./AboutContent";
import SiteFooter from "@/components/SiteFooter";
import { getAboutImages, getContactModuleData } from "@/lib/cms";
import { PAGE_SEO, pageMetadata } from "@/lib/seo";
import { Suspense } from "react";

export const metadata = pageMetadata(PAGE_SEO.about, "/about");

export const revalidate = 60;

export default async function AboutPage() {
  const [{ contact, salesContacts, qrItems, socialLinks }, images] = await Promise.all([
    getContactModuleData(),
    getAboutImages(),
  ]);

  return (
    <main className="min-h-screen">
      <Suspense fallback={<div className="pt-28 page-x text-gray-500">Loading…</div>}>
        <AboutContent
          images={images}
          contact={contact}
          salesContacts={salesContacts}
          qrItems={qrItems}
          socialLinks={socialLinks}
        />
      </Suspense>
      <SiteFooter />
    </main>
  );
}
