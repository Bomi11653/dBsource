"use client";

import type { CaseItem, Product } from "@/data/mock";
import BrowseGuide from "@/components/BrowseGuide";
import ImageLightbox from "@/components/ImageLightbox";
import ProductStickyCta, { ProductDetailActions } from "@/components/ProductStickyCta";
import StackedSpecPanel from "@/components/StackedSpecPanel";
import { getSpecSheetForProduct, getStackedSpecPages } from "@/data/product-specs";
import { useI18n } from "@/components/I18nProvider";
import { getProductGallery } from "@/lib/products";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { Check, Copy, Download } from "lucide-react";
import CmsImage from "@/components/CmsImage";
import Link from "next/link";
import { useCallback, useState } from "react";

export default function ProductDetailContent({
  product,
  relatedCases,
  recommendedProducts = [],
}: {
  product: Product;
  relatedCases: CaseItem[];
  recommendedProducts?: Product[];
}) {
  const { locale, t } = useI18n();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [specsCopied, setSpecsCopied] = useState(false);
  const gallery = getProductGallery(product);
  const body = product.detail?.[locale] ?? product.desc[locale];
  const stackedPages = getStackedSpecPages(product.model);
  const specSheet = stackedPages ? null : getSpecSheetForProduct(product);

  const copySpecs = useCallback(async () => {
    const lines: string[] = [`${product.name[locale]}（${product.model}）`];
    if (product.specs) lines.push(product.specs[locale]);
    const sheets = stackedPages ?? (specSheet ? [specSheet] : []);
    for (const sheet of sheets) {
      if (sheets.length > 1 || sheet.model !== product.model) {
        lines.push("", `[${sheet.model}]`);
      } else {
        lines.push("");
      }
      for (const row of sheet.rows) {
        lines.push(`${row.label[locale]}: ${row.value[locale]}`);
      }
    }
    const copied = await copyTextToClipboard(lines.join("\n").trim());
    if (copied) {
      setSpecsCopied(true);
      setTimeout(() => setSpecsCopied(false), 2000);
    }
  }, [locale, product, specSheet, stackedPages]);

  const downloadName = useCallback(
    (src: string, index: number) => {
      const ext = src.split("?")[0].split(".").pop();
      const safeExt = ext && ext.length <= 5 ? ext : "jpg";
      return `${product.model}-${index + 1}.${safeExt}`;
    },
    [product.model]
  );

  return (
    <div className="bg-black text-white min-h-screen-safe pt-24 pb-sticky-cta md:pb-0">
      <section className="px-6 md:px-20 py-16 md:py-24 border-b border-white/10 max-w-6xl mx-auto">
        <Link
          href="/products"
          className="text-sm text-brand-gold hover:underline mb-8 inline-block"
        >
          ← {t.products.backToList}
        </Link>
        {product.series && (
          <p className="type-label text-xs uppercase tracking-[0.25em] text-brand-gold mb-4">
            {product.series[locale]}
          </p>
        )}
        <h1 className="type-hero text-4xl md:text-5xl mb-2">{product.name[locale]}</h1>
        <p className="text-brand-gold type-label text-lg mb-8">{product.model}</p>
        <p className="text-gray-400 leading-relaxed max-w-3xl text-lg">{body}</p>
        <ProductDetailActions product={product} className="mt-8" />
        <div className="mt-6">
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
              ...(recommendedProducts.length
                ? [{ label: t.products.recommendedSystems, targetId: "product-recommendations" }]
                : []),
              { label: t.guide.productsSpeaker, href: "/products" },
            ]}
            className=""
          />
        </div>
      </section>

      <section
        id="product-gallery"
        className="px-6 md:px-20 py-12 md:py-16 border-b border-white/10 max-w-6xl mx-auto scroll-mt-28"
      >
        <h2 className="type-page-title text-2xl mb-8">{t.products.detailGallery}</h2>
        <div
          className={`grid gap-4 md:gap-6 ${
            gallery.length > 9
              ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {gallery.map((src, i) => (
            <div
              key={src + i}
              className="group relative aspect-[4/3] min-h-[260px] md:min-h-0 rounded-xl overflow-hidden border border-white/10 bg-zinc-900 hover:border-brand-gold/40 transition-colors"
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="absolute inset-0 cursor-zoom-in"
                aria-label={`${product.name[locale]} ${i + 1}`}
              >
                <CmsImage
                  src={src}
                  alt={`${product.name[locale]} ${i + 1}`}
                  fill
                  className="object-contain object-center p-3 md:object-cover md:p-0 md:group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
              <a
                href={src}
                download={downloadName(src, i)}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg bg-black/70 backdrop-blur border border-white/20 text-xs text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-black/90 transition-all touch-active"
                title={locale === "zh" ? "下载原图" : "Download image"}
              >
                <Download size={14} />
                {locale === "zh" ? "下载" : "Save"}
              </a>
            </div>
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
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="type-page-title text-2xl">{t.products.specsTitle}</h2>
            <button
              type="button"
              onClick={copySpecs}
              className={`inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl border text-sm transition-colors touch-active ${
                specsCopied
                  ? "border-white bg-white text-black"
                  : "border-white/20 text-gray-300 hover:border-white/50 hover:text-white"
              }`}
            >
              {specsCopied ? <Check size={15} /> : <Copy size={15} />}
              {specsCopied
                ? locale === "zh"
                  ? "已复制"
                  : "Copied"
                : locale === "zh"
                  ? "复制参数"
                  : "Copy specs"}
            </button>
          </div>
          {product.specs && (
            <p className="text-sm text-gray-400 type-label mb-6 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
              {product.specs[locale]}
            </p>
          )}
          {stackedPages ? (
            <StackedSpecPanel pages={stackedPages} locale={locale} />
          ) : specSheet ? (
            <>
              <p className="text-xs text-gray-500 mb-8 type-label">
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
          ) : null}
        </section>
      )}

      {recommendedProducts.length > 0 && (
        <section
          id="product-recommendations"
          className="px-6 md:px-20 py-16 md:py-20 border-b border-white/10 max-w-6xl mx-auto scroll-mt-28 page-x"
        >
          <h2 className="type-page-title text-2xl mb-2">{t.products.recommendedSystems}</h2>
          <p className="text-sm text-gray-500 mb-8">{t.products.recommendedSystemsDesc}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedProducts.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-brand-gold/35 transition-colors"
              >
                <div className="relative aspect-[4/3] min-h-[200px] md:min-h-0 rounded-lg overflow-hidden bg-zinc-900 mb-3">
                  {p.image ? (
                    <CmsImage
                      src={p.image}
                      alt={p.name[locale]}
                      fill
                      className="object-contain object-center p-2 md:object-cover md:p-0 md:group-hover:scale-105 transition-transform"
                      sizes="240px"
                    />
                  ) : null}
                </div>
                <p className="text-xs text-brand-gold type-label">{p.model}</p>
                <p className="type-card-title text-sm mt-1 group-hover:text-brand-gold transition-colors">
                  {p.name[locale]}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {relatedCases.length > 0 && (
      <section
        id="product-cases"
        className="px-6 md:px-20 py-16 md:py-20 max-w-6xl mx-auto scroll-mt-28 page-x"
      >
        <h2 className="type-page-title text-2xl mb-8">{t.products.detailCases}</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {relatedCases.map((c) => (
            <Link
              key={c.id}
              href={`/cases/${c.id}`}
              className="group bg-white/5 border border-white/10 p-6 rounded-xl hover:border-brand-gold/30 transition-colors"
            >
              <div className="relative aspect-[16/10] min-h-[180px] md:h-40 rounded-lg overflow-hidden mb-4 bg-zinc-900">
                <CmsImage
                  src={c.image}
                  alt={c.title[locale]}
                  fill
                  className="object-cover object-center opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <h3 className="type-card-title text-xl group-hover:text-brand-gold transition-colors">
                {c.title[locale]}
              </h3>
              <p className="text-gray-400 text-sm mt-2">{c.desc[locale]}</p>
              <p className="text-xs text-gray-500 mt-3 type-label">{c.products}</p>
            </Link>
          ))}
        </div>
      </section>
      )}
      <ProductStickyCta product={product} />
    </div>
  );
}
