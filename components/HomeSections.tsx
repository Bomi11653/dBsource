"use client";

import { buildHomeFeaturedProducts, getHomeFeaturedCaseWithImage } from "@/data/home-featured";
import type { CaseItem, Product, SceneItem } from "@/data/mock";
import { getHomeSceneHref } from "@/lib/case-scene-filters";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import CaseCard from "./CaseCard";
import HomeFeaturedProductCard from "./HomeFeaturedProductCard";
import { useI18n } from "./I18nProvider";

export function HomeScenes({ scenes }: { scenes: SceneItem[] }) {
  const { locale, t } = useI18n();
  return (
    <section
      id="home-scenes"
      className="section-y page-x max-w-7xl mx-auto scroll-mt-nav"
    >
      <h2 className="type-page-title text-2xl sm:text-3xl mb-8 md:mb-12">{t.home.scenesTitle}</h2>
      <div className="grid gap-5 md:grid-cols-3 md:gap-8">
        {scenes.map((s, i) => (
          <Link
            key={s.id}
            href={getHomeSceneHref(s)}
            className="reveal-on-scroll group block rounded-xl overflow-hidden border border-white/10 card-touch transition-colors hover:border-brand-gold/35 active:border-brand-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
          >
            <SafeImage
              src={s.image}
              alt={s.name[locale]}
              frameHeight={200}
              sizes="(max-width: 768px) 100vw, 33vw"
              priority={i === 0}
            />
            <div className="p-4 sm:p-5">
              <h3 className="type-card-title text-lg group-hover:text-brand-gold transition-colors">
                {s.name[locale]}
              </h3>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">{s.desc[locale]}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function HomeProductsPreview({ products }: { products: Product[] }) {
  const { locale, t } = useI18n();
  const featured = buildHomeFeaturedProducts(products);

  return (
    <section
      id="home-products"
      className="section-y page-x max-w-7xl mx-auto border-t border-white/5 scroll-mt-nav"
    >
      <div className="flex justify-between items-end mb-6 md:mb-10 gap-4">
        <h2 className="type-page-title text-2xl sm:text-3xl">{t.home.productsTitle}</h2>
        <Link
          href="/products"
          className="shrink-0 text-sm text-white/70 hover:text-white transition-colors min-h-[44px] inline-flex items-center touch-active"
        >
          {t.home.viewAll} →
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        {featured.map((product, index) => (
          <HomeFeaturedProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </section>
  );
}

export function HomeCasesPreview({
  cases,
  featuredCaseOverride,
}: {
  cases: CaseItem[];
  featuredCaseOverride?: {
    caseId?: number;
    title?: { zh: string; en: string };
    desc?: { zh: string; en: string };
    image?: string;
  };
}) {
  const { locale, t } = useI18n();
  const featured = getHomeFeaturedCaseWithImage(cases, featuredCaseOverride);

  if (!featured) {
    return null;
  }

  return (
    <section
      id="home-cases"
      className="section-y page-x max-w-7xl mx-auto border-t border-white/5 scroll-mt-nav"
    >
      <div className="flex justify-between items-end mb-8 md:mb-12 gap-4">
        <h2 className="type-page-title text-2xl sm:text-3xl">{t.home.casesTitle}</h2>
        <Link
          href="/cases"
          className="shrink-0 text-sm text-white/70 hover:text-white transition-colors min-h-[44px] inline-flex items-center touch-active"
        >
          {t.home.viewAll} →
        </Link>
      </div>
      <CaseCard item={featured} locale={locale} />
    </section>
  );
}
