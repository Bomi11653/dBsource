"use client";

import { aboutImages, type AboutImages } from "@/data/about";
import type { ContactInfo } from "@/data/mock";
import type { SalesContactItem } from "@/data/sales-contacts";
import { useI18n } from "@/components/I18nProvider";
import AboutZoomableImage from "@/components/about/AboutZoomableImage";
import ContactDetailsLayout from "@/components/contact/ContactDetailsLayout";
import ImageLightbox from "@/components/ImageLightbox";
import { useMemo, useState } from "react";

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
  salesContacts = [],
}: {
  images?: AboutImages;
  contact: ContactInfo;
  salesContacts?: SalesContactItem[];
}) {
  const { locale, t } = useI18n();
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

          <AboutZoomableImage
            src={gallery[0].src}
            alt={gallery[0].alt}
            onOpen={() => setLightboxIndex(0)}
            containerClassName="mt-16 md:mt-20 w-full aspect-[16/9] md:h-[420px] md:aspect-auto rounded-2xl hero-fade-in-delay"
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

          <AboutZoomableImage
            src={gallery[5].src}
            alt={gallery[5].alt}
            onOpen={() => setLightboxIndex(5)}
            containerClassName="relative w-full aspect-[3/2] md:aspect-[1016/687] rounded-2xl reveal-on-scroll"
            sizes="(max-width: 1200px) 100vw, 1152px"
          />
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
            {images.dsp.map((src, i) => {
              const index = 6 + i;
              const item = gallery[index];
              return (
                <AboutZoomableImage
                  key={src}
                  src={item.src}
                  alt={item.alt}
                  onOpen={() => setLightboxIndex(index)}
                  containerClassName="aspect-[4/3] rounded-2xl reveal-on-scroll"
                  sizes="33vw"
                />
              );
            })}
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

          <div className="reveal-on-scroll">
            <ContactDetailsLayout
              contact={contact}
              salesContacts={salesContacts}
              variant="about"
              infoId="about-contact-info"
              mapId="about-contact-map"
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
