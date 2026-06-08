"use client";

import type { ContactInfo, QRItem } from "@/data/mock";
import QRCarousel from "./QRCarousel";
import { useI18n } from "./I18nProvider";

export default function Footer({
  qrItems,
  contact,
}: {
  qrItems: QRItem[];
  contact: ContactInfo;
}) {
  const { locale, t } = useI18n();

  return (
    <footer className="mt-12 md:mt-24 border-t border-white/10 bg-black text-white">
      <div className="max-w-6xl mx-auto page-x py-10 md:py-14 grid md:grid-cols-2 gap-8 md:gap-16">
        <div>
          <h2 className="text-lg font-light mb-5">{contact.company[locale]}</h2>
          <div className="space-y-1 text-sm text-gray-300">
            {contact.phones.map((phone) => (
              <p key={phone} className="min-h-[44px] flex items-center flex-wrap gap-x-1">
                <span className="text-gray-500">{t.footer.phone}：</span>
                <a
                  href={`tel:${phone}`}
                  className="hover:text-brand-gold transition-colors touch-active py-2"
                >
                  {phone}
                </a>
              </p>
            ))}
            <p className="min-h-[44px] flex items-center flex-wrap gap-x-1">
              <span className="text-gray-500">{t.footer.email}：</span>
              <a
                href={`mailto:${contact.email}`}
                className="hover:text-brand-gold transition-colors touch-active py-2 break-all"
              >
                {contact.email}
              </a>
            </p>
            <p className="pt-2 leading-relaxed">
              <span className="text-gray-500">{t.footer.address}：</span>
              {contact.address[locale]}
            </p>
          </div>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">{contact.footerIntro[locale]}</p>
      </div>

      <QRCarousel items={qrItems} />

      <p className="text-xs text-gray-500 pb-page-safe text-center px-6">{t.footer.rights}</p>
    </footer>
  );
}
