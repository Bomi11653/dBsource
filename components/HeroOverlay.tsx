"use client";

import BrandLogo from "@/components/BrandLogo";
import BrowseGuide from "@/components/BrowseGuide";
import HeroSearchBar from "@/components/HeroSearchBar";
import ScrollGuide from "@/components/ScrollGuide";
import { useI18n } from "./I18nProvider";

/** 与 WebGL 背景分离，避免语言切换时重绘 Canvas 导致动画卡住 */
export default function HeroOverlay() {
  const { t } = useI18n();

  return (
    <section className="pointer-events-none absolute inset-0 z-10 grid grid-rows-[minmax(0,1fr)_auto] text-center text-white">
      {/* 上层：标题 / Logo / 推荐 / 搜索与联想下拉 */}
      <div className="hero-center-content relative z-20 flex min-h-0 w-full flex-col items-center justify-center overflow-visible px-5 sm:px-6 pt-16 safe-top md:pt-20 pb-2 sm:pb-3">
        <h1 className="hero-fade-in type-hero mb-5 max-w-4xl shrink-0 text-3xl sm:mb-10 sm:text-4xl md:mb-14 md:text-5xl lg:text-6xl">
          {t.hero.slogan}
        </h1>
        <div className="hero-fade-in-delay flex w-full max-w-2xl flex-col items-center overflow-visible">
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
            className="mt-4 w-full sm:mt-8 md:mt-10"
          />
          <HeroSearchBar />
        </div>
      </div>

      {/* 下层：向下探索，固定在 Hero 底部居中 */}
      <div className="hero-bottom-explore relative z-40 flex shrink-0 justify-center pb-6 safe-bottom sm:pb-8 md:pb-10 pointer-events-auto">
        <ScrollGuide
          targetId="home-scenes"
          label={t.guide.scroll}
          ariaLabel={t.guide.scrollAria}
        />
      </div>
    </section>
  );
}
