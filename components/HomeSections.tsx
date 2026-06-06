"use client";

import type { CaseItem, SceneItem } from "@/data/mock";
import { HOME_FEATURED_PRODUCTS, getHomeFeaturedCaseWithImage } from "@/data/home-featured";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import CaseCard from "./CaseCard";
import HomeFeaturedProductCard from "./HomeFeaturedProductCard";
import { useI18n } from "./I18nProvider";

export function HomeScenes({ scenes }: { scenes: SceneItem[] }) {
  const { locale, t } = useI18n();
  return (
    <section id="home-scenes" className="py-20 px-6 md:px-10 max-w-7xl mx-auto scroll-mt-28">
      <h2 className="text-3xl font-light mb-12">{t.home.scenesTitle}</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {scenes.map((s) => (
          <div
            key={s.id}
            className="reveal-on-scroll rounded-xl overflow-hidden border border-white/10"
          >
            <SafeImage
              src={s.image}
              alt={s.name[locale]}
              frameHeight={200}
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="p-5">
              <h3 className="text-lg">{s.name[locale]}</h3>
              <p className="text-gray-400 text-sm mt-2">{s.desc[locale]}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomeProductsPreview() {
  const { locale, t } = useI18n();

  return (
    <section id="home-products" className="py-16 md:py-20 px-4 md:px-6 max-w-7xl mx-auto border-t border-white/5 scroll-mt-28">
      <div className="flex justify-between items-end mb-8 md:mb-10 px-2">
        <h2 className="text-3xl font-light">{t.home.productsTitle}</h2>
        <Link href="/products" className="text-sm text-white/70 hover:text-white transition-colors">
          {t.home.viewAll} →
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-5">
        {HOME_FEATURED_PRODUCTS.map((product, index) => (
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
    <section id="home-cases" className="py-20 px-6 md:px-10 max-w-7xl mx-auto border-t border-white/5 scroll-mt-28">
      <div className="flex justify-between items-end mb-12">
        <h2 className="text-3xl font-light">{t.home.casesTitle}</h2>
        <Link href="/cases" className="text-sm text-white/70 hover:text-white transition-colors">
          {t.home.viewAll} →
        </Link>
      </div>
      <div className="space-y-8">
        <CaseCard key={featured.id} item={featured} locale={locale} />
      </div>
    </section>
  );
}
