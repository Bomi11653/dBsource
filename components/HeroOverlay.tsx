"use client";

import BrandLogo from "@/components/BrandLogo";
import BrowseGuide from "@/components/BrowseGuide";
import ScrollGuide from "@/components/ScrollGuide";
import { useI18n } from "./I18nProvider";

/** 与 WebGL 背景分离，避免语言切换时重绘 Canvas 导致动画卡住 */
export default function HeroOverlay() {
  const { t } = useI18n();

  return (
    <section className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 sm:px-6 text-center text-white pt-16 pb-28 safe-bottom md:pt-20 md:pb-0">
      <h1 className="hero-fade-in text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-[0.1em] sm:tracking-[0.12em] leading-tight mb-5 sm:mb-10 md:mb-14">
        {t.hero.slogan}
      </h1>
      <div className="hero-fade-in-delay flex flex-col items-center w-full">
        <BrandLogo variant="hero" priority />
        <BrowseGuide
          title={t.guide.exploreTitle}
          items={[
            { label: t.guide.homeScenes, targetId: "home-scenes" },
            { label: t.guide.homeProducts, targetId: "home-products" },
            { label: t.guide.homeCases, targetId: "home-cases" },
            { label: t.guide.configurator, href: "/configurator" },
          ]}
          layout="stack"
          variant="minimal"
          className="mt-4 sm:mt-8 md:mt-10 w-full"
        />
      </div>
      <ScrollGuide
        targetId="home-scenes"
        label={t.guide.scroll}
        ariaLabel={t.guide.scrollAria}
        className="absolute bottom-6 sm:bottom-8 md:bottom-10 left-1/2 z-10 -translate-x-1/2 safe-bottom"
      />
    </section>
  );
}
