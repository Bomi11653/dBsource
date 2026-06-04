"use client";

import type { Product } from "@/data/mock";
import type { Locale } from "@/lib/i18n";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";

export default function ProductCard({
  product,
  locale,
}: {
  product: Product;
  locale: Locale;
  index?: number;
}) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group block border border-white/10 rounded-xl overflow-hidden hover:border-brand-gold/30 transition-colors bg-brand-muted/50"
    >
      <SafeImage
        src={product.image}
        alt={product.name[locale]}
        frameHeight={192}
        sizes="(max-width: 768px) 100vw, 50vw"
        loading="lazy"
        className="opacity-90 group-hover:scale-105 transition-transform duration-500"
      />
      <div className="p-6">
        <div className="flex justify-between items-start gap-2">
          <h2 className="text-xl font-light">{product.name[locale]}</h2>
          <span className="text-brand-gold text-sm font-mono shrink-0">
            {product.model}
          </span>
        </div>
        <p className="text-gray-400 text-sm mt-3 leading-relaxed">
          {product.desc[locale]}
        </p>
        {product.specs && (
          <p className="text-xs text-gray-500 mt-4 font-mono border-t border-white/5 pt-3">
            {product.specs[locale]}
          </p>
        )}
      </div>
    </Link>
  );
}
