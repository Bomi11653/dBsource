"use client";

import type { ContactInfo, QRItem, SocialLinkItem } from "@/data/mock";
import QRCarousel from "./QRCarousel";
import { useI18n } from "./I18nProvider";
import Link from "next/link";

const FOOTER_NAV = [
  { href: "/", key: "home" as const },
  { href: "/products", key: "products" as const },
  { href: "/cases", key: "cases" as const },
  { href: "/downloads", key: "downloads" as const },
  { href: "/about", key: "about" as const },
] as const;

export default function Footer({
  qrItems,
  contact,
  socialLinks,
}: {
  qrItems: QRItem[];
  contact: ContactInfo;
  socialLinks?: SocialLinkItem[];
}) {
  const { locale, t } = useI18n();

  return (
    <footer className="mt-12 md:mt-24 border-t border-white/10 bg-black text-white">
      <div className="max-w-6xl mx-auto page-x py-10 md:py-14">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16">
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

        <nav
          aria-label={t.nav.megaExplore}
          className="mt-10 pt-8 border-t border-white/10"
        >
          <p className="type-section-label text-center md:text-left mb-3">
            {t.nav.megaExplore}
          </p>
          <div className="filter-scroll md:gap-2.5 pb-1 -mx-1 px-1 md:mx-0 md:px-0">
            {FOOTER_NAV.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                className="filter-chip touch-active shrink-0 inline-flex items-center justify-center filter-chip-idle transition-colors"
              >
                {t.nav[key]}
              </Link>
            ))}
            <Link
              href="/contact"
              className="filter-chip touch-active shrink-0 inline-flex items-center justify-center filter-chip-idle transition-colors"
            >
              {t.nav.contact}
            </Link>
          </div>
        </nav>
      </div>

      <QRCarousel items={qrItems} socialLinks={socialLinks} />

      <p className="text-xs text-gray-500 pb-page-safe text-center page-x">{t.footer.rights}</p>
    </footer>
  );
}
