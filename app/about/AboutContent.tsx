"use client";

import { aboutImages } from "@/data/about";
import { useI18n } from "@/components/I18nProvider";
import Image from "next/image";

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-brand-gold text-xs tracking-[0.35em] uppercase mb-6">
      {children}
    </p>
  );
}

export default function AboutContent() {
  const { t } = useI18n();

  return (
    <div className="bg-black text-white">
      {/* Section 1 — 品牌起源 */}
      <section className="px-6 md:px-10 pt-32 pb-32 md:pb-40">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>{t.about.label}</SectionLabel>
          <div className="space-y-8 hero-fade-in">
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

          <div className="mt-16 md:mt-24 w-full aspect-[16/10] md:h-[500px] relative rounded-2xl overflow-hidden border border-white/5 hero-fade-in-delay">
            <Image
              src={aboutImages.origin}
              alt="dBsource factory"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"

            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* Section 2 — 系统能力（图文交错） */}
      <section className="px-6 md:px-10 py-32 md:py-40 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div className="space-y-8 order-2 lg:order-1 reveal-on-scroll">
            <SectionLabel>02</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">
              {t.about.system.title}
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed max-w-md">
              {t.about.system.body}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 order-1 lg:order-2 reveal-on-scroll">
            <div className="relative h-52 md:h-60 rounded-xl overflow-hidden border border-white/5 bg-white/5">
              <Image
                src={aboutImages.system[0]}
                alt=""
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
                sizes="25vw"
              />
            </div>
            <div className="relative h-52 md:h-60 rounded-xl overflow-hidden border border-white/5 bg-white/5 mt-8 md:mt-12">
              <Image
                src={aboutImages.system[1]}
                alt=""
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
                sizes="25vw"
              />
            </div>
            <div className="relative h-52 md:h-60 rounded-xl overflow-hidden border border-white/5 bg-white/5 col-span-2">
              <Image
                src={aboutImages.system[2]}
                alt=""
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
                sizes="50vw"
              />
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

          <div className="relative w-full aspect-[16/9] md:h-[500px] rounded-2xl overflow-hidden border border-white/5 reveal-on-scroll">
            <Image
              src={aboutImages.focus}
              alt="Focus app"
              fill
              className="object-cover"
              sizes="(max-width: 1200px) 100vw, 1152px"
            />
          </div>
        </div>
      </section>

      {/* Section 4 — DSP 硬件 */}
      <section className="px-6 md:px-10 py-32 md:pb-48 border-t border-white/5">
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

          <div className="grid md:grid-cols-3 gap-6">
            {aboutImages.dsp.map((src, i) => (
              <div
                key={src}
                className="relative h-64 md:h-72 rounded-2xl overflow-hidden border border-white/5 group reveal-on-scroll"
              >
                <Image
                  src={src}
                  alt={`unit48 ${i + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
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
