"use client";

import BrowseGuide from "@/components/BrowseGuide";
import DownloadList from "@/components/DownloadList";
import type { DownloadItem } from "@/data/mock";
import { useI18n } from "@/components/I18nProvider";
import Image from "next/image";
import { Suspense } from "react";

export default function DownloadsContent({ items }: { items: DownloadItem[] }) {
  const { t } = useI18n();

  return (
    <div className="pb-20">
      <div className="relative w-full max-w-6xl mx-auto px-6 md:px-10 mb-12 md:mb-14">
        <div className="relative w-full aspect-[1920/752] rounded-2xl overflow-hidden border border-white/10">
          <Image
            src="/images/downloads/banner-unit48.png"
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1152px) 100vw, 1152px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 flex items-center px-6 md:px-10">
            <div className="relative z-10 max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-light mb-3">{t.downloads.title}</h1>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                {t.downloads.bannerSubtitle}
              </p>
              <BrowseGuide
                title={t.guide.exploreTitle}
                items={[
                  { label: t.guide.downloadsSoftware, href: "/downloads?tab=software" },
                  { label: t.guide.downloadsCatalog, href: "/downloads?tab=catalog" },
                  { label: t.guide.productsSpeaker, href: "/products" },
                  { label: t.guide.contactForm, href: "/contact" },
                ]}
                className="mt-6"
              />
            </div>
          </div>
        </div>
      </div>

      <div id="downloads-list" className="max-w-4xl mx-auto px-6 md:px-10 scroll-mt-28">
        <Suspense fallback={<div className="h-40" />}>
          <DownloadList items={items} />
        </Suspense>
      </div>
    </div>
  );
}
