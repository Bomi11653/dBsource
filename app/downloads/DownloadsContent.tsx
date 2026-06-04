"use client";

import DownloadList from "@/components/DownloadList";
import type { DownloadItem } from "@/data/mock";
import { useI18n } from "@/components/I18nProvider";

export default function DownloadsContent({ items }: { items: DownloadItem[] }) {
  const { t } = useI18n();

  return (
    <div className="pb-20">
      <div className="relative h-56 md:h-64 flex items-center px-6 md:px-10 mb-12 md:mb-14 mx-6 md:mx-10 max-w-6xl md:mx-auto rounded-2xl overflow-hidden border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-zinc-900 to-blue-950/80" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 70% 50%, rgba(46,184,150,0.18), transparent)",
          }}
        />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-light mb-3">{t.downloads.title}</h1>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            {t.downloads.bannerSubtitle}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-10">
        <DownloadList items={items} />
      </div>
    </div>
  );
}
