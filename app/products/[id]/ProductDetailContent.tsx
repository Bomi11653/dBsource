"use client";

import type { CaseItem, Product } from "@/data/mock";
import BrowseGuide from "@/components/BrowseGuide";
import ImageLightbox from "@/components/ImageLightbox";
import StackedSpecPanel from "@/components/StackedSpecPanel";
import { getSpecSheetForProduct, getStackedSpecPages } from "@/data/product-specs";
import { useI18n } from "@/components/I18nProvider";
import { getProductGallery } from "@/lib/products";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function ProductDetailContent({
  product,
  relatedCases,
}: {
  product: Product;
  relatedCases: CaseItem[];
}) {
  const { locale, t } = useI18n();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const gallery = getProductGallery(product);
  const body = product.detail?.[locale] ?? product.desc[locale];
  const stackedPages = getStackedSpecPages(product.model);
  const specSheet = stackedPages ? null : getSpecSheetForProduct(product);

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
        <h1 className="text-4xl md:text-5xl font-medium mb-2">{product.name[locale]}</h1>
        <p className="text-brand-gold font-mono text-lg mb-8">{product.model}</p>
        <p className="text-gray-400 leading-relaxed max-w-3xl text-lg">{body}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href={`/contact?product=${encodeURIComponent(product.model)}`}
            className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-xl bg-brand-gold/90 text-black text-sm font-medium hover:bg-brand-gold transition-colors touch-active"
          >
            {t.products.requestQuote}
          </Link>
          <BrowseGuide
            title={t.guide.exploreTitle}
            items={[
              { label: t.guide.productGallery, targetId: "product-gallery" },
              ...(stackedPages || specSheet || product.specs
                ? [{ label: t.guide.productSpecs, targetId: "product-specs" }]
                : []),
              ...(relatedCases.length
                ? [{ label: t.guide.productCases, targetId: "product-cases" }]
                : []),
              { label: t.guide.productsSpeaker, href: "/products" },
            ]}
            className=""
          />
        </div>
        {product.specs && (
          <p className="text-sm text-gray-500 font-mono mt-6 border-t border-white/10 pt-6">
            {product.specs[locale]}
          </p>
        )}
      </section>

      <section
        id="product-gallery"
        className="px-6 md:px-20 py-12 md:py-16 border-b border-white/10 max-w-6xl mx-auto scroll-mt-28"
      >
        <h2 className="text-2xl font-medium mb-8">{t.products.detailGallery}</h2>
        <div
          className={`grid gap-4 md:gap-6 ${
            gallery.length > 9
              ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {gallery.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-zinc-900 hover:border-brand-gold/40 transition-colors cursor-zoom-in"
              aria-label={`${product.name[locale]} ${i + 1}`}
            >
              <Image
                src={src}
                alt={`${product.name[locale]} ${i + 1}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </button>
          ))}
        </div>
      </section>

      <ImageLightbox
        images={gallery}
        altPrefix={product.name[locale]}
        openIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        labels={{
          close: t.cases.galleryClose,
          prev: t.cases.galleryPrev,
          next: t.cases.galleryNext,
        }}
      />

      {(stackedPages || specSheet || product.specs) && (
        <section
          id="product-specs"
          className="px-6 md:px-20 py-12 md:py-16 border-b border-white/10 max-w-6xl mx-auto scroll-mt-28 page-x"
        >
          <h2 className="text-2xl font-medium mb-8">{t.products.specsTitle}</h2>
          {stackedPages ? (
            <StackedSpecPanel pages={stackedPages} locale={locale} />
          ) : specSheet ? (
            <>
              <p className="text-xs text-gray-500 mb-8 font-mono">
                {locale === "zh" ? "参考型号" : "Reference model"}: {specSheet.model}
              </p>
              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-sm">
                  <tbody>
                    {specSheet.rows.map((row, i) => (
                      <tr
                        key={row.label.zh}
                        className={i % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent"}
                      >
                        <th className="text-left font-normal text-gray-400 px-5 py-3 w-2/5 border-b border-white/5">
                          {row.label[locale]}
                        </th>
                        <td className="text-white px-5 py-3 border-b border-white/5">
                          {row.value[locale]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : product.specs ? (
            <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono leading-relaxed rounded-xl border border-white/10 p-5 bg-white/[0.02]">
              {product.specs[locale]}
            </pre>
          ) : null}
        </section>
      )}

      {relatedCases.length > 0 && (
      <section
        id="product-cases"
        className="px-6 md:px-20 py-16 md:py-20 max-w-6xl mx-auto scroll-mt-28 page-x"
      >
        <h2 className="text-2xl font-medium mb-8">{t.products.detailCases}</h2>
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
              <h3 className="text-xl font-medium group-hover:text-brand-gold transition-colors">
                {c.title[locale]}
              </h3>
              <p className="text-gray-400 text-sm mt-2">{c.desc[locale]}</p>
              <p className="text-xs text-gray-500 mt-3 font-mono">{c.products}</p>
            </Link>
          ))}
        </div>
      </section>
      )}
    </div>
  );
}
