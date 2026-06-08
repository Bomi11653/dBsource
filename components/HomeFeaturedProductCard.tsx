"use client";

import type { HomeFeaturedProduct } from "@/data/home-featured";
import { useI18n } from "@/components/I18nProvider";
import Image from "next/image";
import Link from "next/link";

export default function HomeFeaturedProductCard({
  product,
  index,
}: {
  product: HomeFeaturedProduct;
  index: number;
}) {
  const { locale, t } = useI18n();

  return (
    <article
      className={`group card-touch relative overflow-hidden rounded-2xl md:rounded-[1.75rem] min-h-[300px] md:min-h-[480px] flex flex-col items-center justify-between text-center px-5 sm:px-6 pt-8 md:pt-12 pb-8 md:pb-12 border border-white/10 transition-all duration-500 ease-out md:hover:-translate-y-1 md:hover:border-[#2eb896]/35 md:hover:shadow-[0_24px_60px_rgba(46,184,150,0.12)] cursor-pointer ${
        index === 0
          ? "bg-gradient-to-b from-zinc-800/90 to-zinc-950"
          : "bg-gradient-to-b from-slate-800/80 via-zinc-900 to-black"
      }`}
    >
      <Link
        href={product.detailHref}
        className="absolute inset-0 z-[1] rounded-[1.75rem]"
        aria-label={product.name[locale]}
      />

      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_center,rgba(46,184,150,0.08),transparent_70%)]"
        aria-hidden
      />

      <div className="relative z-[2] pointer-events-none flex flex-col items-center w-full">
        <h3 className="text-xl sm:text-2xl md:text-4xl font-semibold tracking-tight text-white md:group-hover:scale-[1.02] transition-transform duration-500">
          {product.name[locale]}
        </h3>
        <p className="text-sm md:text-base text-gray-400 mt-3 max-w-sm leading-relaxed group-hover:text-gray-300 transition-colors">
          {product.desc[locale]}
        </p>
        <p className="text-xs text-brand-gold/90 font-mono mt-4 tracking-wide">
          {product.models[locale]}
        </p>
      </div>

      <div className="relative z-[2] pointer-events-none w-full flex-1 min-h-[160px] md:min-h-[220px] my-6 md:my-8 flex items-center justify-center">
        <div className="relative w-full max-w-[320px] md:max-w-[380px] aspect-[4/3] md:aspect-square transition-transform duration-500 ease-out group-hover:scale-105">
          <Image
            src={product.image}
            alt={product.name[locale]}
            fill
            className="object-contain object-center drop-shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-[filter] duration-500 group-hover:drop-shadow-[0_20px_50px_rgba(46,184,150,0.25)]"
            sizes="(max-width: 768px) 80vw, 380px"
            priority={index === 0}
          />
        </div>
      </div>

      <div className="relative z-[2] flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 w-full max-w-sm pointer-events-auto">
        <Link
          href={product.detailHref}
          className="relative z-[3] inline-flex items-center justify-center min-h-[48px] rounded-full bg-[#2eb896] px-5 py-2.5 text-sm font-medium text-black hover:opacity-90 transition-all touch-active md:group-hover:shadow-[0_0_20px_rgba(46,184,150,0.35)]"
        >
          {t.home.learnMore}
        </Link>
        <Link
          href="/products?series=speaker&sub=tour"
          className="relative z-[3] inline-flex items-center justify-center min-h-[48px] rounded-full border border-white/30 px-5 py-2.5 text-sm text-white hover:bg-white/10 transition-colors touch-active md:group-hover:border-white/50"
        >
          {t.home.exploreProducts}
        </Link>
      </div>
    </article>
  );
}
