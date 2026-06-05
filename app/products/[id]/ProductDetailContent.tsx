"use client";

import type { CaseItem, Product } from "@/data/mock";
import { useI18n } from "@/components/I18nProvider";
import Image from "next/image";
import Link from "next/link";

export default function ProductDetailContent({
  product,
  relatedCases,
}: {
  product: Product;
  relatedCases: CaseItem[];
}) {
  const { locale, t } = useI18n();
  const gallery = product.gallery ?? [product.image];
  const body = product.detail?.[locale] ?? product.desc[locale];

  return (
    <div className="bg-black text-white min-h-screen pt-24">
      <section className="px-6 md:px-20 py-16 md:py-24 border-b border-white/10 max-w-6xl mx-auto">
        <Link
          href="/products"
          className="text-sm text-brand-gold hover:underline mb-8 inline-block"
        >
          ← {t.products.backToList}
        </Link>
        {product.series && (
          <p className="text-xs uppercase tracking-[0.25em] text-brand-gold mb-4">
            {product.series[locale]}
          </p>
        )}
        <h1 className="text-4xl md:text-5xl font-light mb-2">{product.name[locale]}</h1>
        <p className="text-brand-gold font-mono text-lg mb-8">{product.model}</p>
        <p className="text-gray-400 leading-relaxed max-w-3xl text-lg">{body}</p>
        {product.specs && (
          <p className="text-sm text-gray-500 font-mono mt-6 border-t border-white/10 pt-6">
            {product.specs[locale]}
          </p>
        )}
      </section>

      <section className="px-6 md:px-20 py-16 md:py-20 space-y-16 max-w-6xl mx-auto">
        <div>
          <h2 className="text-2xl font-light mb-8">{t.products.detailGallery}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {gallery.map((src, i) => (
              <div
                key={src + i}
                className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-zinc-900"
              >
                <Image
                  src={src}
                  alt={`${product.name[locale]} ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-light mb-8">{t.products.detailCases}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {relatedCases.map((c) => (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="group bg-white/5 border border-white/10 p-6 rounded-xl hover:border-brand-gold/30 transition-colors"
              >
                <div className="relative h-40 rounded-lg overflow-hidden mb-4 bg-zinc-900">
                  <Image
                    src={c.image}
                    alt={c.title[locale]}
                    fill
                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <h3 className="text-xl font-light group-hover:text-brand-gold transition-colors">
                  {c.title[locale]}
                </h3>
                <p className="text-gray-400 text-sm mt-2">{c.desc[locale]}</p>
                <p className="text-xs text-gray-500 mt-3 font-mono">{c.products}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
