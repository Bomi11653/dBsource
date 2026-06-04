"use client";

import type { CaseItem, Product, SceneItem } from "@/data/mock";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import ProductCard from "./ProductCard";
import CaseCard from "./CaseCard";
import { useI18n } from "./I18nProvider";

export function HomeScenes({ scenes }: { scenes: SceneItem[] }) {
  const { locale, t } = useI18n();
  return (
    <section className="py-20 px-6 md:px-10 max-w-7xl mx-auto">
      <h2 className="text-3xl font-light mb-12">{t.home.scenesTitle}</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {scenes.map((s) => (
          <div
            key={s.id}
            className="reveal-on-scroll rounded-xl overflow-hidden border border-white/10"
          >
            <SafeImage src={s.image} alt={s.name[locale]} frameHeight={160} />
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

export function HomeProductsPreview({ products }: { products: Product[] }) {
  const { locale, t } = useI18n();
  return (
    <section className="py-20 px-6 md:px-10 max-w-7xl mx-auto border-t border-white/5">
      <div className="flex justify-between items-end mb-12">
        <h2 className="text-3xl font-light">{t.home.productsTitle}</h2>
        <Link href="/products" className="text-sm text-brand-gold hover:underline">
          {t.home.viewAll} →
        </Link>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        {products.slice(0, 2).map((p, i) => (
          <ProductCard key={p.id} product={p} locale={locale} index={i} />
        ))}
      </div>
    </section>
  );
}

export function HomeCasesPreview({ cases }: { cases: CaseItem[] }) {
  const { locale, t } = useI18n();
  return (
    <section className="py-20 px-6 md:px-10 max-w-7xl mx-auto border-t border-white/5">
      <div className="flex justify-between items-end mb-12">
        <h2 className="text-3xl font-light">{t.home.casesTitle}</h2>
        <Link href="/cases" className="text-sm text-brand-gold hover:underline">
          {t.home.viewAll} →
        </Link>
      </div>
      <div className="space-y-8">
        {cases.slice(0, 1).map((c, i) => (
          <CaseCard key={c.id} item={c} locale={locale} index={i} />
        ))}
      </div>
    </section>
  );
}
