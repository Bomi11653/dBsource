"use client";

import { aboutImages, type AboutImages } from "@/data/about";
import type { ContactInfo, QRItem, SocialLinkItem } from "@/data/mock";
import type { SalesContactItem } from "@/data/sales-contacts";
import { useI18n } from "@/components/I18nProvider";
import AboutZoomableImage from "@/components/about/AboutZoomableImage";
import ContactModule from "@/components/contact/ContactModule";
import ImageLightbox from "@/components/ImageLightbox";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-brand-gold text-xs tracking-[0.35em] uppercase mb-6">
      {children}
    </p>
  );
}

const systemAspects = ["aspect-[1024/612]", "aspect-[988/749]", "aspect-[598/643]"] as const;
const systemAlts = ["dBcover", "dBcover EQ", "dBcover SPL"] as const;

function buildAboutGallery(images: AboutImages, locale: "zh" | "en") {
  return [
    {
      src: images.brandIntro,
      alt: locale === "zh" ? "dBsource 东莞工厂" : "dBsource Dongguan factory",
    },
    {
      src: images.origin,
      alt: locale === "zh" ? "消声室" : "Anechoic chamber",
    },
    ...images.system.map((src, i) => ({
      src,
      alt: systemAlts[i],
    })),
    {
      src: images.focus,
      alt: "dBsource Focus",
    },
    ...images.dsp.map((src, i) => ({
      src,
      alt: `Unit48 ${i + 1}`,
    })),
  ];
}

export default function AboutContent({
  images = aboutImages,
  contact,
  salesContacts,
  qrItems = [],
  socialLinks = [],
}: {
  images?: AboutImages;
  contact: ContactInfo;
  salesContacts: SalesContactItem[];
  qrItems?: QRItem[];
  socialLinks?: SocialLinkItem[];
}) {
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const productModel = searchParams.get("product") ?? "";
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const gallery = useMemo(() => buildAboutGallery(images, locale), [images, locale]);
  const gallerySrcs = useMemo(() => gallery.map((item) => item.src), [gallery]);

  const lightboxLabels = {
    close: t.cases.galleryClose,
    prev: t.cases.galleryPrev,
    next: t.cases.galleryNext,
  };

  return (
    <div className="bg-black text-white">
      {/* 关于我们 */}
      <section className="page-x pt-24 sm:pt-28 pb-10 md:pb-16 border-b border-white/5">
        <div className="max-w-5xl mx-auto hero-fade-in">
          <SectionLabel>{t.about.label}</SectionLabel>
          <h1 className="type-hero text-3xl sm:text-4xl md:text-5xl tracking-tight">
            {t.about.label}
          </h1>
        </div>
      </section>

      {/* 品牌故事 */}
      <section id="about-story" className="page-x py-16 md:py-40 border-b border-white/5 scroll-mt-nav">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>{t.about.brandStory}</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-10">
            {t.about.brandStory}
          </h2>
          <div className="space-y-8">
            {t.about.origin.body.map((paragraph, i) => (
              <p
                key={i}
                className={`font-light leading-[1.85] text-gray-200 break-words ${
                  i === 0
                    ? "text-xl sm:text-2xl md:text-3xl tracking-tight"
                    : "text-base sm:text-lg md:text-xl text-gray-400"
                }`}
              >
                {paragraph}
              </p>
            ))}
          </div>

          <AboutZoomableImage
            src={gallery[0].src}
            alt={gallery[0].alt}
            onOpen={() => setLightboxIndex(0)}
            containerClassName="mt-16 md:mt-20 w-full aspect-[16/9] md:h-[420px] md:aspect-auto rounded-2xl"
            imageClassName="object-cover object-[center_45%]"
            sizes="(max-width: 1024px) 100vw, 1024px"
            overlay={
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            }
          />

          <AboutZoomableImage
            src={gallery[1].src}
            alt={gallery[1].alt}
            onOpen={() => setLightboxIndex(1)}
            containerClassName="mt-8 md:mt-12 w-full aspect-[4/3] md:h-[500px] md:aspect-auto rounded-2xl"
            sizes="(max-width: 1024px) 100vw, 1024px"
            overlay={
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            }
          />
        </div>
      </section>

      {/* 技术能力 — 工程方案 + 研发 */}
      <section id="about-tech" className="page-x py-16 md:py-40 border-b border-white/5 scroll-mt-nav">
        <div className="max-w-6xl mx-auto space-y-16 md:space-y-20">
          <div className="max-w-2xl reveal-on-scroll">
            <SectionLabel>{t.about.tech.title}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">{t.about.tech.title}</h2>
          </div>

          <div className="space-y-12 md:space-y-16 reveal-on-scroll">
            <div className="max-w-2xl space-y-6">
              <h3 className="text-xl md:text-2xl font-light text-white">
                {t.about.engineering.title}
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed">{t.about.engineering.body}</p>
            </div>
            <div className="space-y-8 md:space-y-10">
              <AboutZoomableImage
                src={gallery[2].src}
                alt={gallery[2].alt}
                onOpen={() => setLightboxIndex(2)}
                containerClassName={`w-full ${systemAspects[0]} rounded-2xl`}
                sizes="(max-width: 1200px) 100vw, 1152px"
              />
              <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                <AboutZoomableImage
                  src={gallery[3].src}
                  alt={gallery[3].alt}
                  onOpen={() => setLightboxIndex(3)}
                  containerClassName={`w-full ${systemAspects[1]} rounded-2xl`}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <AboutZoomableImage
                  src={gallery[4].src}
                  alt={gallery[4].alt}
                  onOpen={() => setLightboxIndex(4)}
                  containerClassName={`w-full ${systemAspects[2]} rounded-2xl md:max-w-md md:justify-self-end`}
                  imageClassName="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
              </div>
            </div>
          </div>

          <div className="space-y-12 md:space-y-16 reveal-on-scroll">
            <div className="max-w-2xl space-y-6">
              <h3 className="text-xl md:text-2xl font-light text-white">{t.about.focus.title}</h3>
              <p className="text-gray-400 text-lg leading-relaxed">{t.about.focus.body}</p>
            </div>
            <AboutZoomableImage
              src={gallery[5].src}
              alt={gallery[5].alt}
              onOpen={() => setLightboxIndex(5)}
              containerClassName="relative w-full aspect-[3/2] md:aspect-[1016/687] rounded-2xl"
              sizes="(max-width: 1200px) 100vw, 1152px"
            />
          </div>

          <div className="space-y-12 md:space-y-16 reveal-on-scroll">
            <div className="max-w-2xl space-y-6">
              <h3 className="text-xl md:text-2xl font-light text-white">{t.about.dsp.title}</h3>
              <p className="text-gray-400 text-lg leading-relaxed">{t.about.dsp.body}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5 md:gap-6">
              {images.dsp.map((src, i) => {
                const index = 6 + i;
                const item = gallery[index];
                return (
                  <AboutZoomableImage
                    key={src}
                    src={item.src}
                    alt={item.alt}
                    onOpen={() => setLightboxIndex(index)}
                    containerClassName="aspect-[4/3] rounded-2xl"
                    sizes="33vw"
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 联系方式 — 与 /contact 同源 CMS */}
      <section id="about-contact" className="page-x pb-page-safe border-t border-white/10 scroll-mt-nav">
        <div className="max-w-6xl mx-auto py-16 md:py-24 space-y-8 md:space-y-10">
          <div className="max-w-2xl reveal-on-scroll">
            <SectionLabel>{t.nav.contact}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">{t.contact.title}</h2>
            <p className="text-gray-400 text-lg leading-relaxed mt-6">{t.contact.subtitle}</p>
          </div>

          <div className="reveal-on-scroll">
            <ContactModule
              contact={contact}
              salesContacts={salesContacts}
              qrItems={qrItems}
              socialLinks={socialLinks}
              productModel={productModel}
              showForm
              showSales
              salesPlacement="after-map"
              infoId="about-contact-info"
              mapId="about-contact-map"
              formId="about-contact-form"
            />
          </div>
        </div>
      </section>

      <ImageLightbox
        images={gallerySrcs}
        altPrefix={locale === "zh" ? "关于 dBsource" : "About dBsource"}
        openIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        labels={lightboxLabels}
      />
    </div>
  );
}
