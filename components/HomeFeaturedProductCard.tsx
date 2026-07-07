"use client";

import type { HomeFeaturedProduct } from "@/data/home-featured";
import { useI18n } from "@/components/I18nProvider";
import { usePerformanceMode } from "@/components/PerformanceModeProvider";
import CmsImage from "@/components/CmsImage";
import { resolveBrowserMediaUrl } from "@/lib/media-url";
import { isWeChatWebView } from "@/lib/wechat-webview";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomeFeaturedProductCard({
  product,
  index,
}: {
  product: HomeFeaturedProduct;
  index: number;
}) {
  const { locale, t } = useI18n();
  const { resolvedMode } = usePerformanceMode();
  const normalizedImage = resolveBrowserMediaUrl(product.image);
  const [displayImage, setDisplayImage] = useState(normalizedImage);

  useEffect(() => {
    let cancelled = false;
    const safeSrc = resolveBrowserMediaUrl(product.image);
    setDisplayImage(safeSrc);
    if (resolvedMode !== "high" || isWeChatWebView()) return;

    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(image, 0, 0);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const isNearWhite = max >= 232 && max - min <= 26;
          if (!isNearWhite) continue;
          const whiteness = (max - 232) / (255 - 232);
          const keep = Math.max(0, Math.min(1, 1 - whiteness));
          data[i + 3] = Math.round(a * keep);
        }

        ctx.putImageData(frame, 0, 0);
        const transparentPng = canvas.toDataURL("image/png");
        if (!cancelled) setDisplayImage(transparentPng);
      } catch {
        if (!cancelled) setDisplayImage(safeSrc);
      }
    };
    image.onerror = () => {
      if (!cancelled) setDisplayImage(safeSrc);
    };
    image.src = safeSrc;

    return () => {
      cancelled = true;
    };
  }, [product.image, resolvedMode]);

  return (
    <article
      className={`group card-touch relative overflow-hidden rounded-2xl md:rounded-[1.75rem] min-h-[300px] md:min-h-[480px] flex flex-col items-center justify-between text-center px-5 sm:px-6 pt-8 md:pt-12 pb-8 md:pb-12 border border-white/10 transition-all duration-500 ease-out md:hover:-translate-y-1 md:hover:border-white/35 md:hover:shadow-[0_24px_60px_rgba(255,255,255,0.08)] cursor-pointer ${
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
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),transparent_70%)]"
        aria-hidden
      />

      <div className="relative z-[2] pointer-events-none flex flex-col items-center w-full">
        <h3 className="type-card-title text-xl sm:text-2xl md:text-4xl text-white md:group-hover:scale-[1.02] transition-transform duration-500">
          {product.name[locale]}
        </h3>
        <p className="text-sm md:text-base text-gray-400 mt-3 max-w-sm leading-relaxed group-hover:text-gray-300 transition-colors">
          {product.desc[locale]}
        </p>
        <p className="text-xs text-brand-gold/90 type-label mt-4">
          {product.models[locale]}
        </p>
      </div>

      <div className="relative z-[2] pointer-events-none w-full flex-1 min-h-[160px] md:min-h-[220px] my-6 md:my-8 flex items-center justify-center">
        <div className="relative w-full max-w-[320px] md:max-w-[380px] aspect-[4/3] md:aspect-square transition-transform duration-500 ease-out group-hover:scale-105">
          <CmsImage
            src={displayImage}
            alt={product.name[locale]}
            fill
            className="object-contain object-center drop-shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-[filter] duration-500 group-hover:drop-shadow-[0_20px_50px_rgba(255,255,255,0.12)]"
            sizes="(max-width: 768px) 80vw, 380px"
            priority={index === 0}
            unoptimized={displayImage.startsWith("data:image/")}
          />
        </div>
      </div>

      <div className="relative z-[2] flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 w-full max-w-sm pointer-events-auto">
        <Link
          href={product.detailHref}
          className="relative z-[3] inline-flex items-center justify-center min-h-[48px] rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90 transition-all touch-active md:group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
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
