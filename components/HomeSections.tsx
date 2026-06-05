"use client";

import type { CaseItem, Product, SceneItem } from "@/data/mock";
import Link from "next/link";
import Image from "next/image";
import SafeImage from "@/components/SafeImage";
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
  const featured = products.slice(0, 2);

  return (
    <section className="py-16 md:py-20 px-4 md:px-6 max-w-7xl mx-auto border-t border-white/5">
      <div className="flex justify-between items-end mb-8 md:mb-10 px-2">
        <h2 className="text-3xl font-light">{t.home.productsTitle}</h2>
        <Link href="/products" className="text-sm text-white/70 hover:text-white transition-colors">
          {t.home.viewAll} →
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-5">
        {featured.map((product, index) => (
          <article
            key={product.id}
            className={`relative overflow-hidden rounded-[1.75rem] min-h-[420px] md:min-h-[520px] flex flex-col items-center text-center px-6 pt-12 md:pt-14 pb-8 ${
              index === 0
                ? "bg-gradient-to-b from-zinc-800/90 to-zinc-950"
                : "bg-gradient-to-b from-slate-800/80 via-zinc-900 to-black"
            }`}
          >
            <h3 className="text-2xl md:text-4xl font-semibold tracking-tight text-white">
              {product.name[locale]}
            </h3>
            <p className="text-sm md:text-base text-gray-400 mt-3 max-w-sm leading-relaxed">
              {product.desc[locale]}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <Link
                href={`/products/${product.id}`}
                className="inline-flex items-center rounded-full bg-[#2eb896] px-5 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
              >
                {t.home.learnMore}
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center rounded-full border border-white/30 px-5 py-2 text-sm text-white hover:bg-white/10 transition-colors"
              >
                {t.home.exploreProducts}
              </Link>
            </div>
            <div className="relative flex-1 w-full mt-8 md:mt-10 flex items-end justify-center min-h-[180px]">
              <Image
                src={product.image}
                alt={product.name[locale]}
                width={360}
                height={240}
                className="w-auto h-36 md:h-48 object-contain opacity-95 drop-shadow-2xl"
              />
            </div>
          </article>
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
        <Link href="/cases" className="text-sm text-white/70 hover:text-white transition-colors">
          {t.home.viewAll} →
        </Link>
      </div>
      <div className="space-y-8">
        {cases.slice(0, 1).map((c) => (
          <CaseCard key={c.id} item={c} locale={locale} />
        ))}
      </div>
    </section>
  );
}
