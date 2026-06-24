"use client";

import type { CaseItem } from "@/data/mock";
import BrowseGuide from "@/components/BrowseGuide";
import ImageLightbox from "@/components/ImageLightbox";
import { useI18n } from "@/components/I18nProvider";
import { getCaseCoverUrl, getCaseGalleryUrls, getCaseHeroUrl } from "@/lib/case-media";
import CmsImage from "@/components/CmsImage";
import Link from "next/link";
import { useState } from "react";

export default function CaseDetailContent({
  caseItem,
  relatedCases,
}: {
  caseItem: CaseItem;
  relatedCases: CaseItem[];
}) {
  const { locale, t } = useI18n();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const body = caseItem.detail?.[locale] ?? caseItem.desc[locale];
  const cover = getCaseCoverUrl(caseItem);
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
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-20 py-12 max-w-6xl mx-auto">
          <Link
            href="/cases"
            className="text-sm text-brand-gold hover:underline mb-6 inline-block"
          >
            ← {t.cases.backToList}
          </Link>
          <p className="type-label text-xs uppercase tracking-[0.25em] text-brand-gold mb-3">
            {caseItem.scene[locale]}
          </p>
          <h1 className="type-hero text-4xl md:text-5xl">{caseItem.title[locale]}</h1>
          <p className="text-gray-400 text-sm type-label mt-4">{caseItem.products}</p>
          <BrowseGuide
            title={t.guide.exploreTitle}
            items={[
              { label: t.guide.caseOverview, targetId: "case-overview" },
              { label: t.guide.caseGallery, targetId: "case-gallery" },
              ...(relatedCases.length
                ? [{ label: t.guide.caseRelated, targetId: "case-related" }]
                : []),
              { label: t.guide.productsSpeaker, href: "/products" },
            ]}
            className="mt-6"
          />
        </div>
      </section>

      <section
        id="case-overview"
        className="px-6 md:px-20 py-16 md:py-20 max-w-6xl mx-auto border-b border-white/10 scroll-mt-28"
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
        <p className="text-sm text-gray-500 type-label mt-10 border-t border-white/10 pt-6">
          {t.cases.equipment}: {caseItem.products}
        </p>
      </section>

      <section
        id="case-gallery"
        className="px-6 md:px-20 py-16 md:py-20 max-w-6xl mx-auto border-b border-white/10 scroll-mt-28"
      >
        <h2 className="text-2xl font-medium mb-8">{t.cases.gallery}</h2>
        {heroImages.length > 0 ? (
        <div
          className={`grid gap-4 md:gap-6 ${
            heroImages.length > 9
              ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {heroImages.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="group relative aspect-[4/3] min-h-[260px] md:min-h-0 rounded-xl overflow-hidden border border-white/10 bg-white hover:border-brand-gold/40 transition-colors cursor-zoom-in"
              aria-label={`${caseItem.title[locale]} ${i + 1}`}
            >
              <CmsImage
                src={src}
                alt={`${caseItem.title[locale]} ${i + 1}`}
                fill
                className="object-contain object-center p-2 md:object-cover md:p-0 md:group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={i === 0}
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

      {relatedCases.length > 0 && (
        <section
          id="case-related"
          className="px-6 md:px-20 py-16 md:py-20 max-w-6xl mx-auto scroll-mt-28"
        >
          <h2 className="text-2xl font-medium mb-8">{t.cases.related}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {relatedCases.map((c) => {
              const relatedCover = getCaseCoverUrl(c);
              return (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="group bg-white/5 border border-white/10 p-6 rounded-xl hover:border-brand-gold/30 transition-colors"
              >
                <div className="relative aspect-[16/10] min-h-[180px] md:h-40 rounded-lg overflow-hidden mb-4 bg-zinc-900">
                  {relatedCover ? (
                  <CmsImage
                    src={relatedCover}
                    alt={c.title[locale]}
                    fill
                    className="object-cover object-center opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  ) : null}
                </div>
                <span className="text-xs text-brand-gold uppercase tracking-wider">
                  {c.scene[locale]}
                </span>
                <h3 className="text-xl font-medium mt-2 group-hover:text-brand-gold transition-colors">
                  {c.title[locale]}
                </h3>
                <p className="text-gray-400 text-sm mt-2 line-clamp-2">{c.desc[locale]}</p>
              </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
