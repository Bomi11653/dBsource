import AboutContent from "./AboutContent";
import SiteFooter from "@/components/SiteFooter";
import { getAboutImages, getContactInfo, getSalesContacts } from "@/lib/cms";
import { PAGE_SEO, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(PAGE_SEO.about, "/about");

export default async function AboutPage() {
  const [images, contact, salesContacts] = await Promise.all([
    getAboutImages(),
    getContactInfo(),
    getSalesContacts(),
  ]);

  return (
    <main className="min-h-screen">
      <AboutContent images={images} contact={contact} salesContacts={salesContacts} />
      <SiteFooter />
    </main>
  );
}
