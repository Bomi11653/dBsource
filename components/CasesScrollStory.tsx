"use client";

import type { CaseItem } from "@/data/mock";
import { getScrollStoryLayout } from "@/lib/cases";
import { useI18n } from "@/components/I18nProvider";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion";
import Image from "next/image";
import BrowseGuide from "@/components/BrowseGuide";
import ScrollGuide from "@/components/ScrollGuide";
import Link from "next/link";
import { useRef } from "react";

function StickyCaseVisual({
  caseItem,
  locale,
  scrollYProgress,
  viewDetailLabel,
}: {
  caseItem: CaseItem;
  locale: "zh" | "en";
  scrollYProgress: MotionValue<number>;
  viewDetailLabel: string;
}) {
  const scale = useSpring(useTransform(scrollYProgress, [0, 0.5], [1, 1.15]), {
    stiffness: 100,
    damping: 30,
  });
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.55], [1, 1, 0.15]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.2, 0.45], [0, 1, 0]);

  return (
    <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
      <motion.div className="absolute inset-0" style={{ scale, opacity }}>
        <Image
          src={caseItem.image}
          alt={caseItem.title[locale]}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/50" />
      </motion.div>
      <motion.div
        className="relative z-10 text-center px-6 max-w-3xl"
        style={{ opacity: textOpacity }}
      >
        <p className="text-brand-gold text-xs tracking-[0.35em] uppercase mb-4">
          {caseItem.scene[locale]}
        </p>
        <h2 className="text-3xl md:text-5xl font-light">{caseItem.title[locale]}</h2>
        <p className="text-gray-300 mt-4 text-sm font-mono">{caseItem.products}</p>
        <Link
          href={`/cases/${caseItem.id}`}
          className="pointer-events-auto inline-block mt-8 text-sm border border-brand-gold/50 px-6 py-2.5 text-brand-gold hover:bg-brand-gold/10 transition-colors"
        >
          {viewDetailLabel} →
        </Link>
      </motion.div>
    </div>
  );
}

export default function CasesScrollStory({ cases }: { cases: CaseItem[] }) {
  const { locale, t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const { hero: heroCase, profile: profileCase, spotlight: spotlightCase, moreCases } =
    getScrollStoryLayout(cases);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  if (!heroCase) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        No cases
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-black text-white">
      {/* 第一屏：品牌标题 + 彝族新年晚会现场背景 */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        <Image
          src="/images/cases/cases-hero-bg.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />
        <div className="relative z-10 flex flex-col items-center px-6">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl font-light tracking-tight text-center drop-shadow-lg"
          >
            {t.cases.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-gray-300 mt-6 text-center max-w-lg drop-shadow-md"
          >
            {t.cases.subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-8"
          >
            <BrowseGuide
              title={t.guide.exploreTitle}
              items={[
                { label: t.guide.casesEngineering, href: "/cases?type=engineering" },
                { label: t.guide.casesPerformance, href: "/cases?type=performance" },
                { label: t.guide.productsSpeaker, href: "/products" },
              ]}
              className="items-center"
            />
          </motion.div>
        </div>
        <ScrollGuide
          targetId="cases-story"
          label={t.guide.scroll}
          ariaLabel={t.guide.scrollAria}
          className="absolute bottom-8 md:bottom-10 left-1/2 z-10 -translate-x-1/2"
        />
      </section>

      {/* 第二屏：Sticky 全屏视觉（Apple 核心） */}
      <section id="cases-story" className="h-[220vh] relative scroll-mt-28">
        <StickyCaseVisual
          caseItem={heroCase}
          locale={locale}
          scrollYProgress={scrollYProgress}
          viewDetailLabel={t.cases.viewDetail}
        />
      </section>

      {/* 第三屏：项目背景 + 图文 */}
      <section className="min-h-screen grid md:grid-cols-2 items-center gap-12 md:gap-20 px-6 md:px-20 py-24">
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-brand-gold text-xs tracking-[0.3em] uppercase mb-4">
            {t.cases.projectBackground}
          </p>
          <Link href={`/cases/${profileCase.id}`} className="group inline-block">
            <h2 className="text-3xl md:text-4xl font-light mb-6 group-hover:text-brand-gold transition-colors">
              {profileCase.title[locale]}
            </h2>
          </Link>
          <p className="text-gray-400 leading-relaxed text-lg">{profileCase.desc[locale]}</p>
          <p className="text-gray-500 text-sm font-mono mt-8 border-t border-white/10 pt-6">
            {t.cases.deliverables}: {profileCase.products}
          </p>
        </motion.div>
        <motion.div
          className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10"
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          {profileCase && (
            <Image
              src={profileCase.image}
              alt={profileCase.title[locale]}
              fill
              className="object-cover"
              sizes="50vw"
            />
          )}
        </motion.div>
      </section>

      {/* 第四屏：大图切换 */}
      <section className="min-h-screen flex items-center justify-center px-6 py-24">
        <motion.div
          className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden border border-white/10"
          initial={{ opacity: 0, scale: 0.88 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {spotlightCase && (
            <Image
              src={spotlightCase.image}
              alt={spotlightCase.title[locale]}
              fill
              className="object-cover"
              sizes="(max-width: 1200px) 90vw"
            />
          )}
          {spotlightCase && (
            <Link
              href={`/cases/${spotlightCase.id}`}
              className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/90 via-black/20 to-transparent hover:from-black/95 transition-colors"
            >
              <h3 className="text-2xl font-light">{spotlightCase.title[locale]}</h3>
              <p className="text-gray-400 mt-2 text-sm">{spotlightCase.desc[locale]}</p>
              <span className="text-brand-gold text-sm mt-4">{t.cases.viewDetail} →</span>
            </Link>
          )}
        </motion.div>
      </section>

      {/* 第五屏：数据成交点 */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-24">
        <motion.p
          className="text-brand-gold text-xs tracking-[0.35em] uppercase mb-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {t.cases.results}
        </motion.p>
        <motion.h2
          className="text-5xl md:text-7xl font-light text-gradient-gold"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {t.cases.stat1}
        </motion.h2>
        <motion.p
          className="text-xl text-gray-400 mt-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
        >
          {t.cases.stat1Label}
        </motion.p>
        <div className="grid grid-cols-3 gap-8 md:gap-16 mt-16 max-w-3xl w-full">
          {[
            { value: t.cases.stat2, label: t.cases.stat2Label },
            { value: t.cases.stat3, label: t.cases.stat3Label },
            { value: "IP55", label: locale === "zh" ? "防护等级" : "Ingress" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="border border-white/10 rounded-xl py-8 px-4"
            >
              <p className="text-2xl md:text-3xl font-light text-brand-gold">{item.value}</p>
              <p className="text-xs text-gray-500 mt-2 uppercase tracking-wider">{item.label}</p>
            </motion.div>
          ))}
        </div>
        <motion.p
          className="text-gray-500 mt-12 tracking-wide"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          {t.cases.statSub}
        </motion.p>
      </section>

      {/* 全部案例入口 */}
      <section className="px-6 md:px-20 py-24 border-t border-white/10">
        <h3 className="text-2xl font-light text-center mb-12">
          {locale === "zh" ? "全部案例" : "All Projects"}
        </h3>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {cases.map((item) => (
            <Link
              key={item.id}
              href={`/cases/${item.id}`}
              className="group border border-white/10 rounded-xl overflow-hidden hover:border-brand-gold/30 transition-colors"
            >
              <div className="relative aspect-[16/10] bg-zinc-900">
                <Image src={item.image} alt={item.title[locale]} fill className="object-cover" />
              </div>
              <div className="p-5">
                <span className="text-xs text-brand-gold uppercase tracking-wider">
                  {item.scene[locale]}
                </span>
                <h4 className="text-lg font-light mt-2 group-hover:text-brand-gold transition-colors">
                  {item.title[locale]}
                </h4>
                <p className="text-gray-500 text-sm mt-2 line-clamp-2">{item.desc[locale]}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 更多案例条 */}
      {moreCases.length > 0 && (
        <section className="px-6 md:px-20 py-24 border-t border-white/10 space-y-16">
          <h3 className="text-2xl font-light text-center text-gray-400">
            {locale === "zh" ? "更多案例" : "More Projects"}
          </h3>
          {moreCases.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: index * 0.08 }}
            >
              <Link
                href={`/cases/${item.id}`}
                className={`group grid md:grid-cols-2 gap-10 items-center ${
                  index % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-white/10 group-hover:border-brand-gold/30 transition-colors">
                  <Image src={item.image} alt={item.title[locale]} fill className="object-cover" />
                </div>
                <div>
                  <span className="text-xs text-brand-gold uppercase tracking-wider">
                    {item.scene[locale]}
                  </span>
                  <h4 className="text-2xl font-light mt-3 group-hover:text-brand-gold transition-colors">
                    {item.title[locale]}
                  </h4>
                  <p className="text-gray-400 mt-4 leading-relaxed">{item.desc[locale]}</p>
                  <span className="text-brand-gold text-sm mt-4 inline-block">
                    {t.cases.viewDetail} →
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </section>
      )}
    </div>
  );
}
