"use client";

import { contactInfo } from "@/data/mock";
import type { QRItem } from "@/data/mock";
import QRCarousel from "./QRCarousel";
import { useI18n } from "./I18nProvider";

export default function Footer({ qrItems }: { qrItems: QRItem[] }) {
  const { locale, t } = useI18n();

  return (
    <footer className="mt-24 border-t border-white/10 bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14 grid md:grid-cols-2 gap-10 md:gap-16">
        <div>
          <h2 className="text-lg font-light mb-5">{contactInfo.company[locale]}</h2>
          <div className="space-y-2 text-sm text-gray-300">
            {contactInfo.phones.map((phone) => (
              <p key={phone}>
                <span className="text-gray-500">{t.footer.phone}：</span>
                <a href={`tel:${phone}`} className="hover:text-brand-gold transition-colors">
                  {phone}
                </a>
              </p>
            ))}
            <p>
              <span className="text-gray-500">{t.footer.email}：</span>
              <a
                href={`mailto:${contactInfo.email}`}
                className="hover:text-brand-gold transition-colors"
              >
                {contactInfo.email}
              </a>
            </p>
            <p>
              <span className="text-gray-500">{t.footer.address}：</span>
              {contactInfo.address[locale]}
            </p>
          </div>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">{t.footer.intro}</p>
      </div>

      <QRCarousel items={qrItems} />

      <p className="text-xs text-gray-500 pb-12 text-center px-10">{t.footer.rights}</p>
    </footer>
  );
}
