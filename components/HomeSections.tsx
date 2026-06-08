"use client";

import { HOME_FEATURED_PRODUCTS, buildHomeFeaturedProducts, getHomeFeaturedCaseWithImage } from "@/data/home-featured";
import type { CaseItem, Product, SceneItem } from "@/data/mock";
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
      <h2 className="text-2xl sm:text-3xl font-light mb-8 md:mb-12">{t.home.scenesTitle}</h2>
      <div className="grid gap-5 md:grid-cols-3 md:gap-8">
        {scenes.map((s) => (
          <div
            key={s.id}
            className="reveal-on-scroll rounded-xl overflow-hidden border border-white/10 card-touch"
          >
            <SafeImage
              src={s.image}
              alt={s.name[locale]}
              frameHeight={200}
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="p-4 sm:p-5">
              <h3 className="text-lg font-medium">{s.name[locale]}</h3>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">{s.desc[locale]}</p>
            </div>
          </div>
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
        <h2 className="text-2xl sm:text-3xl font-light">{t.home.productsTitle}</h2>
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

export function HomeCasesPreview({ cases }: { cases: CaseItem[] }) {
  const { locale, t } = useI18n();
  const featured = getHomeFeaturedCaseWithImage(cases);

  return (
    <section
      id="home-cases"
      className="section-y page-x max-w-7xl mx-auto border-t border-white/5 scroll-mt-nav"
    >
      <div className="flex justify-between items-end mb-8 md:mb-12 gap-4">
        <h2 className="text-2xl sm:text-3xl font-light">{t.home.casesTitle}</h2>
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
