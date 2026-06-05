"use client";

import { useI18n } from "./I18nProvider";
import Image from "next/image";

/** 与 WebGL 背景分离，避免语言切换时重绘 Canvas 导致动画卡住 */
export default function HeroOverlay() {
  const { t } = useI18n();

  return (
    <section className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white pt-20">
      <h1 className="hero-fade-in text-4xl md:text-5xl lg:text-6xl font-bold tracking-[0.12em] leading-tight mb-10 md:mb-14">
        {t.hero.slogan}
      </h1>
      <div className="hero-fade-in-delay flex flex-col items-center">
        <Image
          src="/brand/logo.png"
          alt="dBsource"
          width={112}
          height={48}
          className="h-[2.4rem] md:h-[3.2rem] lg:h-[3.6rem] w-auto object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.15)]"
          priority
        />
      </div>
    </section>
  );
}
