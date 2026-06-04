"use client";

import type { CaseItem } from "@/data/mock";
import { useI18n } from "@/components/I18nProvider";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

function StickyCaseVisual({
  caseItem,
  locale,
  scrollYProgress,
}: {
  caseItem: CaseItem;
  locale: "zh" | "en";
  scrollYProgress: MotionValue<number>;
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
      </motion.div>
    </div>
  );
}

export default function CasesScrollStory({ cases }: { cases: CaseItem[] }) {
  const { locale, t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroCase = cases[0];
  const secondCase = cases[1];
  const thirdCase = cases[2];

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
      {/* 第一屏：品牌标题 */}
      <section className="h-screen flex flex-col items-center justify-center relative">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl font-light tracking-tight text-center"
        >
          {t.cases.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-gray-500 mt-6 text-center max-w-lg"
        >
          {t.cases.subtitle}
        </motion.p>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1 }}
          className="absolute bottom-12 text-xs tracking-[0.3em] text-gray-600 uppercase"
        >
          {t.cases.scrollLabel}
        </motion.span>
      </section>

      {/* 第二屏：Sticky 全屏视觉（Apple 核心） */}
      <section className="h-[220vh] relative">
        <StickyCaseVisual
          caseItem={heroCase}
          locale={locale}
          scrollYProgress={scrollYProgress}
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
          <h2 className="text-3xl md:text-4xl font-light mb-6">{heroCase.title[locale]}</h2>
          <p className="text-gray-400 leading-relaxed text-lg">{heroCase.desc[locale]}</p>
          <p className="text-gray-500 text-sm font-mono mt-8 border-t border-white/10 pt-6">
            {t.cases.deliverables}: {heroCase.products}
          </p>
        </motion.div>
        <motion.div
          className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10"
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          {secondCase && (
            <Image
              src={secondCase.image}
              alt={secondCase.title[locale]}
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
          {thirdCase && (
            <Image
              src={thirdCase.image}
              alt={thirdCase.title[locale]}
              fill
              className="object-cover"
              sizes="(max-width: 1200px) 90vw"
            />
          )}
          {thirdCase && (
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent">
              <h3 className="text-2xl font-light">{thirdCase.title[locale]}</h3>
              <p className="text-gray-400 mt-2 text-sm">{thirdCase.desc[locale]}</p>
            </div>
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

      {/* 更多案例条 */}
      {cases.length > 1 && (
        <section className="px-6 md:px-20 py-24 border-t border-white/10 space-y-16">
          <h3 className="text-2xl font-light text-center text-gray-400">
            {locale === "zh" ? "更多案例" : "More Projects"}
          </h3>
          {cases.slice(1).map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: index * 0.08 }}
              className={`grid md:grid-cols-2 gap-10 items-center ${
                index % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-white/10">
                <Image src={item.image} alt={item.title[locale]} fill className="object-cover" />
              </div>
              <div>
                <span className="text-xs text-brand-gold uppercase tracking-wider">
                  {item.scene[locale]}
                </span>
                <h4 className="text-2xl font-light mt-3">{item.title[locale]}</h4>
                <p className="text-gray-400 mt-4 leading-relaxed">{item.desc[locale]}</p>
              </div>
            </motion.article>
          ))}
        </section>
      )}
    </div>
  );
}
