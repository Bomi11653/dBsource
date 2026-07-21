"use client";

import type { ContactInfo, QRItem, SocialLinkItem } from "@/data/mock";
import type { SalesContactItem } from "@/data/sales-contacts";
import { useI18n } from "@/components/I18nProvider";
import BrowseGuide from "@/components/BrowseGuide";
import ContactModule from "@/components/contact/ContactModule";
import { useSearchParams } from "next/navigation";

export default function ContactContent({
  contact,
  salesContacts,
  qrItems = [],
  socialLinks = [],
}: {
  contact: ContactInfo;
  salesContacts: SalesContactItem[];
  qrItems?: QRItem[];
  socialLinks?: SocialLinkItem[];
}) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const productModel = searchParams.get("product") ?? "";

  const guideItems = [
    { label: t.guide.contactInfo, targetId: "contact-info" },
    ...(salesContacts.length
      ? [{ label: t.contact.salesTitle, targetId: "contact-sales" }]
      : []),
    { label: t.contact.mapSectionTitle, targetId: "contact-map" },
    ...(qrItems.length ? [{ label: t.footer.scan, targetId: "contact-social" }] : []),
    { label: t.guide.contactForm, targetId: "contact-form" },
  ];

  return (
    <div className="contact-page bg-black text-white overflow-x-hidden">
      <section className="pt-24 sm:pt-28 pb-6 sm:pb-8 page-x text-center">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-light leading-snug">{t.contact.title}</h1>
        <p className="text-gray-400 mt-3 sm:mt-4 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          {t.contact.subtitle}
        </p>
        <BrowseGuide
          title={t.guide.exploreTitle}
          items={guideItems}
          align="center"
          className="mt-6 sm:mt-8"
        />
      </section>

      <div className="page-x pb-page-safe md:pb-12">
        <div className="mx-auto max-w-6xl min-w-0">
          <ContactModule
            contact={contact}
            salesContacts={salesContacts}
            qrItems={qrItems}
            socialLinks={socialLinks}
            productModel={productModel}
          />
        </div>
      </div>
    </div>
  );
}
