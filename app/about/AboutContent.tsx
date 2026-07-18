"use client";

import { aboutImages, type AboutImages } from "@/data/about";
import type { ContactInfo } from "@/data/mock";
import type { SalesContactItem } from "@/data/sales-contacts";
import { useI18n } from "@/components/I18nProvider";
import ContactInfoSection from "@/components/contact/ContactInfoSection";
import CmsImage from "@/components/CmsImage";
import SalesContactCards from "@/components/SalesContactCards";

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-brand-gold text-xs tracking-[0.35em] uppercase mb-6">
      {children}
    </p>
  );
}

const systemAspects = ["aspect-[1024/612]", "aspect-[988/749]", "aspect-[598/643]"] as const;
const systemAlts = ["dBcover", "dBcover EQ", "dBcover SPL"] as const;

export default function AboutContent({
  images = aboutImages,
  contact,
  salesContacts = [],
}: {
  images?: AboutImages;
  contact: ContactInfo;
  salesContacts?: SalesContactItem[];
}) {
  const { locale, t } = useI18n();

  return (
    <div className="bg-black text-white">
      {/* Section 1 — 品牌起源 */}
      <section className="page-x pt-24 sm:pt-28 pb-16 md:pb-40">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>{t.about.label}</SectionLabel>
          <div id="about-story" className="space-y-8 hero-fade-in scroll-mt-28">
            {t.about.origin.body.map((paragraph, i) => (
              <p
                key={i}
                className={`font-light leading-[1.85] text-gray-200 break-words ${
                  i === 0
                    ? "text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-tight"
                    : "text-base sm:text-lg md:text-xl text-gray-400"
                }`}
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-16 md:mt-20 w-full aspect-[16/9] md:h-[420px] relative rounded-2xl overflow-hidden border border-white/5 hero-fade-in-delay">
            <CmsImage
              src={images.brandIntro}
              alt={locale === "zh" ? "dBsource 东莞工厂" : "dBsource Dongguan factory"}
              fill
              className="object-cover object-[center_45%]"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>

          <div className="mt-8 md:mt-12 w-full aspect-[4/3] md:h-[500px] relative rounded-2xl overflow-hidden border border-white/5">
            <CmsImage
              src={images.origin}
              alt={locale === "zh" ? "消声室" : "Anechoic chamber"}
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* Section 2 — 系统能力（分开展示） */}
      <section id="about-system" className="page-x py-16 md:py-40 border-t border-white/5 scroll-mt-nav">
        <div className="max-w-6xl mx-auto space-y-12 md:space-y-16">
          <div className="max-w-2xl reveal-on-scroll">
            <SectionLabel>02</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">
              {t.about.system.title}
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mt-6">
              {t.about.system.body}
            </p>
          </div>

          <div className="space-y-8 md:space-y-10 reveal-on-scroll">
            <div
              className={`relative w-full ${systemAspects[0]} rounded-2xl overflow-hidden border border-white/5`}
            >
              <CmsImage
                src={images.system[0]}
                alt={systemAlts[0]}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1200px) 100vw, 1152px"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-8 md:gap-10">
              <div
                className={`relative w-full ${systemAspects[1]} rounded-2xl overflow-hidden border border-white/5`}
              >
                <CmsImage
                  src={images.system[1]}
                  alt={systemAlts[1]}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div
                className={`relative w-full ${systemAspects[2]} rounded-2xl overflow-hidden border border-white/5 md:max-w-md md:justify-self-end`}
              >
                <CmsImage
                  src={images.system[2]}
                  alt={systemAlts[2]}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — Focus 软件 */}
      <section className="page-x py-16 md:py-40 border-t border-white/5">
        <div className="max-w-6xl mx-auto space-y-12 md:space-y-16">
          <div className="max-w-2xl reveal-on-scroll">
            <SectionLabel>03</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">
              {t.about.focus.title}
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mt-6">
              {t.about.focus.body}
            </p>
          </div>

          <div className="relative w-full aspect-[3/2] md:aspect-[1016/687] rounded-2xl overflow-hidden border border-white/5 reveal-on-scroll">
            <CmsImage
              src={images.focus}
              alt="dBsource Focus"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1200px) 100vw, 1152px"
            />
          </div>
        </div>
      </section>

      {/* Section 4 — DSP 硬件 */}
      <section id="about-dsp" className="page-x py-16 md:pb-48 border-t border-white/5 scroll-mt-nav">
        <div className="max-w-6xl mx-auto space-y-12 md:space-y-16">
          <div className="max-w-2xl reveal-on-scroll">
            <SectionLabel>04</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">
              {t.about.dsp.title}
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mt-6">
              {t.about.dsp.body}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {images.dsp.map((src, i) => (
              <div
                key={src}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/5 group reveal-on-scroll"
              >
                <CmsImage
                  src={src}
                  alt={`Unit48 ${i + 1}`}
                  fill
                  className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-700"
                  sizes="33vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 联系信息 */}
      <section className="page-x pb-page-safe border-t border-white/10">
        <div className="max-w-6xl mx-auto py-16 md:py-24 space-y-8 md:space-y-10">
          <div className="max-w-2xl reveal-on-scroll">
            <SectionLabel>{t.nav.contact}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">
              {t.contact.title}
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mt-6">
              {t.contact.subtitle}
            </p>
          </div>

          <div className="hidden lg:block space-y-8 reveal-on-scroll">
            <ContactInfoSection
              contact={contact}
              layout="split"
              mapEmbedWhen="lg"
              infoId="about-contact-info"
              mapId="about-contact-map"
            />
            {salesContacts.length > 0 ? (
              <div className="contact-sales-shell">
                <SalesContactCards contacts={salesContacts} />
              </div>
            ) : null}
          </div>

          <div className="grid gap-6 lg:hidden reveal-on-scroll">
            <ContactInfoSection
              contact={contact}
              showMap={false}
              infoId="about-contact-info"
              mapId="about-contact-map"
            />
            {salesContacts.length > 0 ? (
              <div className="contact-sales-shell">
                <SalesContactCards contacts={salesContacts} />
              </div>
            ) : null}
            <ContactInfoSection
              contact={contact}
              showCompany={false}
              mapEmbedWhen="below-lg"
              infoId="about-contact-info"
              mapId="about-contact-map"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
