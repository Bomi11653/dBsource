"use client";

import dynamic from "next/dynamic";
import { useI18n } from "./I18nProvider";

const SoundWave = dynamic(() => import("@/components/SoundWave"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-black" />,
});

export default function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-black text-white px-6 pt-24 pb-16 overflow-hidden">
      {/* WebGL 声波背景 */}
      <div className="absolute inset-0 z-0 opacity-70 pointer-events-none">
        <SoundWave />
      </div>
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none" />

      {/* 品牌内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-4xl gap-16 md:gap-24">
        <h1 className="hero-fade-in text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-center leading-tight text-white drop-shadow-lg">
          {t.hero.slogan}
        </h1>

        <div className="hero-fade-in-delay flex flex-col items-center">
          <img
            src="/brand/logo.png"
            alt="dBsource"
            width={80}
            height={100}
            className="w-[70px] md:w-[80px] h-auto object-contain drop-shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}
