"use client";

import DownloadList from "@/components/DownloadList";
import type { DownloadItem } from "@/data/mock";
import { useI18n } from "@/components/I18nProvider";
import { Headphones, Monitor, RefreshCw, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";

const HERO_COPY = {
  zh: {
    eyebrow: "Download Center",
    title: "下载中心",
    desc: "获取 dBsource 软件、产品手册、技术资料与固件升级包，为工程调试、系统集成与售后维护提供完整支持。",
    features: [
      { icon: ShieldCheck, title: "官方正版", desc: "安全可靠" },
      { icon: RefreshCw, title: "持续更新", desc: "功能优化" },
      { icon: Monitor, title: "多平台支持", desc: "兼容 Windows / Mac" },
      { icon: Headphones, title: "专业支持", desc: "技术团队支持" },
    ],
  },
  en: {
    eyebrow: "Download Center",
    title: "Downloads",
    desc: "Get dBsource software, product manuals, technical resources and firmware updates — full support for commissioning, integration and after-sales service.",
    features: [
      { icon: ShieldCheck, title: "Official", desc: "Safe & reliable" },
      { icon: RefreshCw, title: "Updates", desc: "Continuous improvements" },
      { icon: Monitor, title: "Cross-platform", desc: "Windows / Mac" },
      { icon: Headphones, title: "Pro support", desc: "Engineering team" },
    ],
  },
} as const;

export default function DownloadsContent({ items }: { items: DownloadItem[] }) {
  const { locale } = useI18n();
  const copy = HERO_COPY[locale];

  return (
    <div className="bg-black pb-page-safe">
      {/* Hero：整幅背景图 + 左侧文案 */}
      <section className="relative overflow-hidden border-b border-white/10 bg-zinc-950 min-h-[220px] sm:min-h-[280px]">
        <Image
          src="/images/downloads/banner-unit48.png"
          alt=""
          fill
          className="object-cover object-center md:object-right"
          sizes="100vw"
          loading="lazy"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/20"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent"
          aria-hidden
        />
        <div className="relative max-w-7xl mx-auto page-x py-12 md:py-20 lg:py-24">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-light text-white mb-2">{copy.title}</h1>
            <p className="text-lg md:text-xl text-white/[0.62] font-light tracking-wide mb-6">
              {copy.eyebrow}
            </p>
            <p className="text-sm md:text-base text-white/[0.72] leading-relaxed max-w-xl">
              {copy.desc}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 md:mt-10">
              {copy.features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex flex-col gap-2.5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-black/40 backdrop-blur text-white">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{title}</p>
                    <p className="text-xs text-white/[0.55] mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div id="downloads-list" className="max-w-7xl mx-auto page-x scroll-mt-nav">
        <Suspense fallback={<div className="h-40" />}>
          <DownloadList items={items} />
        </Suspense>
      </div>
    </div>
  );
}
