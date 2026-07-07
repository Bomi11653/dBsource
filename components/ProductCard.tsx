"use client";

import type { Product } from "@/data/mock";
import type { Locale } from "@/lib/i18n";
import { SafeImageAspect } from "@/components/SafeImage";
import { getProductDisplayTitle } from "@/lib/product-display";
import { Package } from "lucide-react";
import Link from "next/link";

export default function ProductCard({
  product,
  locale,
}: {
  product: Product;
  locale: Locale;
  index?: number;
}) {
  const { primary, subtitle, label } = getProductDisplayTitle(product, locale);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block border border-white/10 rounded-xl overflow-hidden hover:border-brand-gold/30 transition-colors bg-brand-muted/50"
    >
      {product.image ? (
        <SafeImageAspect
          src={product.image}
          alt={label}
          aspectClassName="aspect-[4/3]"
          minHeightClassName="min-h-[240px] md:min-h-0"
          fit="contain"
          frameClassName="bg-white"
          sizes="(max-width: 768px) 100vw, 50vw"
          imageClassName="opacity-90 md:group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div
          className="flex items-center justify-center bg-zinc-900/80"
          style={{ height: 192 }}
          aria-hidden
        >
          <Package className="h-10 w-10 text-white/20" />
        </div>
      )}
      <div className="p-6">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h2 className="type-card-title text-xl">{primary}</h2>
            {subtitle ? (
              <p className="text-brand-gold text-sm type-label mt-1">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-3 leading-relaxed">
          {product.desc[locale]}
        </p>
        {product.specs && (
          <p className="text-xs text-gray-500 mt-4 type-label border-t border-white/5 pt-3">
            {product.specs[locale]}
          </p>
        )}
      </div>
    </Link>
  );
}
