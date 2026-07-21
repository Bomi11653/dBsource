"use client";

import type { CaseItem } from "@/data/mock";
import BrowseGuide from "@/components/BrowseGuide";
import ImageLightbox from "@/components/ImageLightbox";
import { useI18n } from "@/components/I18nProvider";
import { getCaseGalleryUrls, getCaseHeroUrl } from "@/lib/case-media";
import { getCaseProjectOverview } from "@/lib/case-project-overview";
import CmsImage from "@/components/CmsImage";
import Link from "next/link";
import { useState } from "react";

export default function CaseDetailContent({
  caseItem,
}: {
  caseItem: CaseItem;
}) {
  const { locale, t } = useI18n();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const body = getCaseProjectOverview(caseItem, locale);
  const heroSrc = getCaseHeroUrl(caseItem);
  const heroImages = getCaseGalleryUrls(caseItem);
  const highlights = caseItem.highlights?.[locale] ?? [];

  return (
    <div className="bg-black text-white min-h-screen-safe pt-24">
      <section className="relative min-h-[min(52dvh,420px)] md:h-[60vh] border-b border-white/10 bg-white md:bg-zinc-950">
        {heroSrc ? (
          <CmsImage
            src={heroSrc}
            alt={caseItem.title[locale]}
            fill
            className="object-contain object-center md:object-cover md:object-center"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-900" aria-hidden />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 page-x py-10 md:py-12 max-w-6xl mx-auto">
          <Link
            href="/cases"
            className="text-sm text-brand-gold hover:underline mb-6 inline-block"
          >
            ← {t.cases.backToList}
          </Link>
          <h1 className="type-hero text-3xl md:text-5xl break-words">{caseItem.title[locale]}</h1>
          <BrowseGuide
            title={t.guide.exploreTitle}
            items={[
              { label: t.guide.caseOverview, targetId: "case-overview" },
              { label: t.guide.caseGallery, targetId: "case-gallery" },
              { label: t.guide.productsSpeaker, href: "/products" },
            ]}
            className="mt-6"
          />
        </div>
      </section>

      <section
        id="case-overview"
        className="page-x py-12 md:py-20 max-w-6xl mx-auto border-b border-white/10 scroll-mt-28"
      >
        <h2 className="type-page-title text-2xl mb-6">{t.cases.overview}</h2>
        <p className="text-gray-400 leading-relaxed text-lg max-w-3xl whitespace-pre-line">
          {body}
        </p>
        {highlights.length > 0 && (
          <div className="mt-10">
            <h3 className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-4">
              {t.cases.highlights}
            </h3>
            <ul className="grid sm:grid-cols-3 gap-4">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="border border-white/10 rounded-xl px-5 py-4 text-center text-brand-gold text-sm"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section
        id="case-gallery"
        className="page-x py-12 md:py-20 max-w-6xl mx-auto border-b border-white/10 scroll-mt-28"
      >
        <h2 className="text-2xl font-medium mb-8">{t.cases.gallery}</h2>
        {heroImages.length > 0 ? (
        <div
          className={`grid gap-4 md:gap-6 ${
            heroImages.length > 9
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {heroImages.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="group relative aspect-[4/3] min-h-[200px] md:min-h-0 rounded-xl overflow-hidden border border-white/10 bg-white hover:border-brand-gold/40 transition-colors cursor-zoom-in"
              aria-label={`${caseItem.title[locale]} ${i + 1}`}
            >
              <CmsImage
                src={src}
                alt={`${caseItem.title[locale]} ${i + 1}`}
                fill
                className="object-contain object-center p-2 md:p-0 md:object-cover md:group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </button>
          ))}
        </div>
        ) : (
          <p className="text-gray-500 text-sm">{t.products.noResults}</p>
        )}
      </section>

      {heroImages.length > 0 && (
      <ImageLightbox
        images={heroImages}
        altPrefix={caseItem.title[locale]}
        openIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        labels={{
          close: t.cases.galleryClose,
          prev: t.cases.galleryPrev,
          next: t.cases.galleryNext,
        }}
      />
      )}
    </div>
  );
}
