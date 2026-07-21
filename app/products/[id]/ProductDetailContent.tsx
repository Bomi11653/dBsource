"use client";

import type { Product } from "@/data/mock";
import BrowseGuide from "@/components/BrowseGuide";
import ImageLightbox from "@/components/ImageLightbox";
import ProductStickyCta, { ProductDetailActions } from "@/components/ProductStickyCta";
import StackedSpecPanel from "@/components/StackedSpecPanel";
import type { ProductSpecSheet } from "@/data/product-specs";
import { useI18n } from "@/components/I18nProvider";
import { getProductGallery } from "@/lib/products";
import { formatProductHeading, getProductDisplayTitle } from "@/lib/product-display";
import {
  getCmsSpecDisplayRows,
  getProductSpecFallback,
  productHasCmsSpecTable,
  productHasSpecSection,
  type ProductSpecDisplayRow,
} from "@/lib/product-spec-display";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { Check, Copy, Download } from "lucide-react";
import CmsImage from "@/components/CmsImage";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

function SpecTable({
  rows,
  locale,
}: {
  rows: ProductSpecDisplayRow[];
  locale: "zh" | "en";
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm min-w-[280px]">
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={`${row.label[locale]}-${row.value[locale]}-${i}`}
              className={i % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent"}
            >
              <th className="text-left font-normal text-gray-400 px-5 py-3 w-2/5 min-w-[7rem] border-b border-white/5 break-words">
                {row.label[locale] || "—"}
              </th>
              <td className="text-white px-5 py-3 border-b border-white/5 break-words min-w-0">
                {row.value[locale]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ProductDetailContent({
  product,
}: {
  product: Product;
}) {
  const { locale, t } = useI18n();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [specsCopied, setSpecsCopied] = useState(false);
  const { primary, subtitle, label } = getProductDisplayTitle(product, locale);
  const gallery = getProductGallery(product);
  const body = product.detail?.[locale] ?? product.desc[locale];

  const cmsSpecRows = useMemo(() => getCmsSpecDisplayRows(product), [product]);
  const useCmsSpecTable = productHasCmsSpecTable(product);
  const specFallback = useMemo(
    () => (useCmsSpecTable ? null : getProductSpecFallback(product)),
    [product, useCmsSpecTable]
  );
  const stackedPages = Array.isArray(specFallback) ? specFallback : null;
  const specSheet = specFallback && !Array.isArray(specFallback) ? specFallback : null;
  const showRawSpecText =
    product.specs &&
    !useCmsSpecTable &&
    product.specs[locale].trim().length > 0;

  const copySpecs = useCallback(async () => {
    const lines: string[] = [formatProductHeading(product, locale)];

    if (cmsSpecRows) {
      lines.push("");
      for (const row of cmsSpecRows) {
        lines.push(`${row.label[locale]}: ${row.value[locale]}`);
      }
    } else if (showRawSpecText && product.specs) {
      lines.push(product.specs[locale]);
    }

    const sheets: ProductSpecSheet[] = stackedPages ?? (specSheet ? [specSheet] : []);
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
  }, [cmsSpecRows, locale, product, showRawSpecText, specSheet, stackedPages]);

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
      <section className="page-x py-12 md:py-24 border-b border-white/10 max-w-6xl mx-auto">
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
        <h1 className={`type-hero text-3xl md:text-5xl break-words ${subtitle ? "mb-2" : "mb-8"}`}>{primary}</h1>
        {subtitle ? (
          <p className="text-brand-gold type-label text-lg mb-8">{subtitle}</p>
        ) : null}
        <p className="text-gray-400 leading-relaxed max-w-3xl text-lg">{body}</p>
        <ProductDetailActions product={product} className="mt-8" />
        <div className="mt-6">
          <BrowseGuide
            title={t.guide.exploreTitle}
            items={[
              { label: t.guide.productGallery, targetId: "product-gallery" },
              ...(productHasSpecSection(product)
                ? [{ label: t.guide.productSpecs, targetId: "product-specs" }]
                : []),
              { label: t.guide.productsSpeaker, href: "/products" },
            ]}
            className=""
          />
        </div>
      </section>

      <section
        id="product-gallery"
        className="page-x py-12 md:py-16 border-b border-white/10 max-w-6xl mx-auto scroll-mt-28"
      >
        <h2 className="type-page-title text-2xl mb-8">{t.products.detailGallery}</h2>
        <div
          className={`grid gap-4 md:gap-6 ${
            gallery.length > 9
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {gallery.map((src, i) => (
            <div
              key={src + i}
              className="group relative aspect-[4/3] min-h-[200px] md:min-h-0 rounded-xl overflow-hidden border border-white/10 bg-white hover:border-brand-gold/40 transition-colors"
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="absolute inset-0 cursor-zoom-in"
                aria-label={`${label} ${i + 1}`}
              >
                <CmsImage
                  src={src}
                  alt={`${label} ${i + 1}`}
                  fill
                  className="object-contain object-center p-4 md:p-5 md:group-hover:scale-[1.02] transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
        altPrefix={label}
        openIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        labels={{
          close: t.cases.galleryClose,
          prev: t.cases.galleryPrev,
          next: t.cases.galleryNext,
        }}
      />

      {productHasSpecSection(product) && (
        <section
          id="product-specs"
          className="page-x py-12 md:py-16 border-b border-white/10 max-w-6xl mx-auto scroll-mt-28"
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
          {useCmsSpecTable && cmsSpecRows ? (
            <SpecTable rows={cmsSpecRows} locale={locale} />
          ) : showRawSpecText ? (
            <p className="text-sm text-gray-400 type-label mb-6 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
              {product.specs?.[locale]}
            </p>
          ) : null}
          {!useCmsSpecTable && stackedPages ? (
            <StackedSpecPanel pages={stackedPages} locale={locale} />
          ) : !useCmsSpecTable && specSheet ? (
            <>
              <p className="text-xs text-gray-500 mb-8 type-label">
                {locale === "zh" ? "参考型号" : "Reference model"}: {specSheet.model}
              </p>
              <SpecTable
                rows={specSheet.rows.map((row) => ({
                  label: row.label,
                  value: row.value,
                }))}
                locale={locale}
              />
            </>
          ) : null}
        </section>
      )}

      <ProductStickyCta product={product} />
    </div>
  );
}
