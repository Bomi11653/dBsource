import ContactContent from "./ContactContent";
import SiteFooter from "@/components/SiteFooter";
import { getContactInfo, getSalesContacts } from "@/lib/cms";
import { PAGE_SEO, pageMetadata } from "@/lib/seo";
import { Suspense } from "react";

export const metadata = pageMetadata(PAGE_SEO.contact, "/contact");

export const revalidate = 60;

export default async function ContactPage() {
  const [contact, salesContacts] = await Promise.all([getContactInfo(), getSalesContacts()]);

  return (
    <main className="min-h-screen-safe">
      <Suspense fallback={<div className="pt-28 page-x text-gray-500">Loading…</div>}>
        <ContactContent contact={contact} salesContacts={salesContacts} />
      </Suspense>
      <SiteFooter />
    </main>
  );
}
