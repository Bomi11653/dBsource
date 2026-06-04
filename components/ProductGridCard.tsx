"use client";

import type { Product } from "@/data/mock";
import type { Locale } from "@/lib/i18n";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";

export default function ProductGridCard({
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
      className="group flex flex-col h-full bg-black/80 border border-white/10 rounded-lg overflow-hidden hover:border-brand-gold/25 hover:shadow-[0_8px_32px_rgba(46,184,150,0.12)] transition-all duration-300 hover:scale-[1.03]"
    >
      <div className="relative shrink-0" style={{ height: 160 }}>
        <SafeImage
          src={product.image}
          alt={product.name[locale]}
          frameHeight={160}
          sizes="(max-width: 640px) 100vw, 25vw"
          loading="lazy"
          className="opacity-85 group-hover:scale-105 group-hover:opacity-100 transition-transform duration-500"
        />
        {product.series && (
          <span className="absolute top-2 left-2 z-10 text-[10px] uppercase tracking-wider px-2 py-0.5 bg-black/70 border border-white/10 text-brand-gold">
            {product.series[locale]}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <h2 className="text-sm font-light leading-snug line-clamp-2 group-hover:text-white transition-colors">
            {product.name[locale]}
          </h2>
          <p className="text-brand-gold text-xs font-mono mt-1">{product.model}</p>
        </div>
        <p className="text-gray-500 text-xs mt-3 line-clamp-2 leading-relaxed">
          {product.desc[locale]}
        </p>
      </div>
    </Link>
  );
}
