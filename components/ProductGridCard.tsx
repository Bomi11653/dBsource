"use client";

import type { Product } from "@/data/mock";
import type { Locale } from "@/lib/i18n";
import SafeImage, { SafeImageAspect } from "@/components/SafeImage";
import { getProductDisplayTitle } from "@/lib/product-display";
import { Package } from "lucide-react";
import Link from "next/link";

export default function ProductGridCard({
  product,
  locale,
  index = 0,
}: {
  product: Product;
  locale: Locale;
  index?: number;
}) {
  const { primary, subtitle, label } = getProductDisplayTitle(product, locale);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group card-touch flex flex-col h-full bg-black/80 border border-white/10 rounded-xl overflow-hidden hover:border-white/25 hover:shadow-[0_8px_32px_rgba(255,255,255,0.08)] transition-all duration-300 md:hover:scale-[1.02]"
    >
      <div className="relative shrink-0 w-full">
        {product.image ? (
          <SafeImageAspect
            src={product.image}
            alt={label}
            aspectClassName="aspect-[4/3]"
            minHeightClassName="min-h-[220px] md:min-h-0"
            fit="contain"
            frameClassName="bg-white"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            imageClassName="opacity-95 md:group-hover:scale-105 md:group-hover:opacity-100 transition-transform duration-500"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center bg-zinc-900/80 border-b border-white/5"
            aria-hidden
          >
            <Package className="h-10 w-10 text-white/20" />
          </div>
        )}
        {product.series && (
          <span className="absolute top-2 left-2 z-10 text-[10px] uppercase tracking-wider px-2 py-0.5 bg-black/70 border border-white/10 text-brand-gold">
            {product.series[locale]}
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          <h2 className="type-card-title text-sm leading-snug line-clamp-2 break-words group-hover:text-white transition-colors">
            {primary}
          </h2>
          {subtitle ? (
            <p className="text-brand-gold text-xs type-label mt-1 line-clamp-1">{subtitle}</p>
          ) : null}
        </div>
        <p className="text-gray-500 text-xs mt-3 line-clamp-2 leading-relaxed">
          {product.desc[locale]}
        </p>
      </div>
    </Link>
  );
}
