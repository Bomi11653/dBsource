"use client";

import BrandLogo from "@/components/BrandLogo";
import HeroSearchBar from "@/components/HeroSearchBar";
import { useI18n } from "./I18nProvider";

/** 与 WebGL 背景分离，避免语言切换时重绘 Canvas 导致动画卡住 */
export default function HeroOverlay() {
  const { t } = useI18n();

  return (
    <section className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-center text-white">
      <div className="hero-center-content relative z-20 flex min-h-0 w-full flex-col items-center justify-center overflow-visible px-5 sm:px-6 pt-16 safe-top md:pt-20 pb-8 safe-bottom sm:pb-10">
        <h1 className="hero-fade-in type-hero mb-4 sm:mb-5 max-w-4xl shrink-0 text-2xl sm:text-4xl md:text-5xl lg:text-6xl">
          {t.hero.slogan}
        </h1>
        <div className="hero-fade-in-delay flex w-full max-w-2xl flex-col items-center overflow-visible">
          <BrandLogo variant="hero" priority />
          <HeroSearchBar />
        </div>
      </div>
    </section>
  );
}
