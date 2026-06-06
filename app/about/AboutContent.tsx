"use client";

import BrowseGuide from "@/components/BrowseGuide";
import { aboutImages, type AboutImages } from "@/data/about";
import { useI18n } from "@/components/I18nProvider";
import Image from "next/image";

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-brand-gold text-xs tracking-[0.35em] uppercase mb-6">
      {children}
    </p>
  );
}

const systemAspects = ["aspect-[1024/612]", "aspect-[988/749]", "aspect-[598/643]"] as const;
const systemAlts = ["dBcover", "dBcover EQ", "dBcover SPL"] as const;

export default function AboutContent({ images = aboutImages }: { images?: AboutImages }) {
  const { locale, t } = useI18n();

  return (
    <div className="bg-black text-white">
      {/* Section 1 — 品牌起源 */}
      <section className="px-6 md:px-10 pt-32 pb-32 md:pb-40">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>{t.about.label}</SectionLabel>
          <BrowseGuide
            title={t.guide.exploreTitle}
            items={[
              { label: t.guide.aboutStory, targetId: "about-story" },
              { label: t.guide.aboutSystem, targetId: "about-system" },
              { label: t.guide.aboutDsp, targetId: "about-dsp" },
              { label: t.guide.productsSpeaker, href: "/products" },
            ]}
            className="mb-10"
          />
          <div id="about-story" className="space-y-8 hero-fade-in scroll-mt-28">
            {t.about.origin.body.map((paragraph, i) => (
              <p
                key={i}
                className={`font-light leading-[1.85] text-gray-200 ${
                  i === 0
                    ? "text-2xl md:text-3xl lg:text-4xl tracking-tight"
                    : "text-lg md:text-xl text-gray-400"
                }`}
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-16 md:mt-20 w-full aspect-[16/9] md:h-[420px] relative rounded-2xl overflow-hidden border border-white/5 hero-fade-in-delay">
            <Image
              src={images.brandIntro}
              alt={locale === "zh" ? "dBsource 东莞工厂" : "dBsource Dongguan factory"}
              fill
              className="object-cover object-[center_45%]"
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>

          <div className="mt-8 md:mt-12 w-full aspect-[4/3] md:h-[500px] relative rounded-2xl overflow-hidden border border-white/5">
            <Image
              src={images.origin}
              alt={locale === "zh" ? "消声室" : "Anechoic chamber"}
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* Section 2 — 系统能力（分开展示） */}
      <section id="about-system" className="px-6 md:px-10 py-32 md:py-40 border-t border-white/5 scroll-mt-28">
        <div className="max-w-6xl mx-auto space-y-12 md:space-y-16">
          <div className="max-w-2xl reveal-on-scroll">
            <SectionLabel>02</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">
              {t.about.system.title}
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mt-6">
              {t.about.system.body}
            </p>
          </div>

          <div className="space-y-8 md:space-y-10 reveal-on-scroll">
            <div
              className={`relative w-full ${systemAspects[0]} rounded-2xl overflow-hidden border border-white/5`}
            >
              <Image
                src={images.system[0]}
                alt={systemAlts[0]}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1200px) 100vw, 1152px"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-8 md:gap-10">
              <div
                className={`relative w-full ${systemAspects[1]} rounded-2xl overflow-hidden border border-white/5`}
              >
                <Image
                  src={images.system[1]}
                  alt={systemAlts[1]}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div
                className={`relative w-full ${systemAspects[2]} rounded-2xl overflow-hidden border border-white/5 md:max-w-md md:justify-self-end`}
              >
                <Image
                  src={images.system[2]}
                  alt={systemAlts[2]}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — Focus 软件 */}
      <section className="px-6 md:px-10 py-32 md:py-40 border-t border-white/5">
        <div className="max-w-6xl mx-auto space-y-12 md:space-y-16">
          <div className="max-w-2xl reveal-on-scroll">
            <SectionLabel>03</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">
              {t.about.focus.title}
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mt-6">
              {t.about.focus.body}
            </p>
          </div>

          <div className="relative w-full aspect-[3/2] md:aspect-[1016/687] rounded-2xl overflow-hidden border border-white/5 reveal-on-scroll">
            <Image
              src={images.focus}
              alt="dBsource Focus"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1200px) 100vw, 1152px"
            />
          </div>
        </div>
      </section>

      {/* Section 4 — DSP 硬件 */}
      <section id="about-dsp" className="px-6 md:px-10 py-32 md:pb-48 border-t border-white/5 scroll-mt-28">
        <div className="max-w-6xl mx-auto space-y-12 md:space-y-16">
          <div className="max-w-2xl reveal-on-scroll">
            <SectionLabel>04</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">
              {t.about.dsp.title}
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mt-6">
              {t.about.dsp.body}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {images.dsp.map((src, i) => (
              <div
                key={src}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/5 group reveal-on-scroll"
              >
                <Image
                  src={src}
                  alt={`Unit48 ${i + 1}`}
                  fill
                  className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-700"
                  sizes="33vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 信任背书条 */}
      <section className="px-6 md:px-10 pb-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 border-t border-white/10 pt-16">
          {t.about.stats.map((stat) => (
            <div
              key={stat}
              className="text-center py-8 border border-white/5 rounded-xl reveal-on-scroll"
            >
              <p className="text-sm tracking-[0.2em] text-brand-gold uppercase">
                {stat}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
