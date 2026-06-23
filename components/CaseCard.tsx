"use client";

import type { CaseItem } from "@/data/mock";
import type { Locale } from "@/lib/i18n";
import { getCaseCoverUrl, hasCaseCover } from "@/lib/case-media";
import SafeImage, { SafeImageAspect } from "@/components/SafeImage";
import Link from "next/link";

export default function CaseCard({
  item,
  locale,
}: {
  item: CaseItem;
  locale: Locale;
  index?: number;
}) {
  const cover = getCaseCoverUrl(item);

  return (
    <Link
      href={`/cases/${item.id}`}
      className="group card-touch block"
    >
      <article className="flex flex-col md:flex-row gap-0 md:gap-6 border border-white/10 rounded-xl overflow-hidden hover:border-brand-gold/30 transition-colors active:border-brand-gold/20">
        {hasCaseCover(item) ? (
          <div className="w-full md:w-72 shrink-0">
            <SafeImageAspect
              src={cover}
              alt={item.title[locale]}
              aspectClassName="aspect-[16/10]"
              minHeightClassName="min-h-[200px] md:min-h-[200px]"
              fit="cover"
              frameClassName="bg-zinc-900"
              imageClassName="object-center"
              sizes="(max-width: 768px) 100vw, 33vw"
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className="w-full md:w-72 shrink-0 bg-zinc-900/70 md:border-r border-white/5"
            style={{ minHeight: 200 }}
            aria-hidden
          />
        )}
        <div className="p-4 sm:p-6 flex flex-col justify-center">
          <span className="text-xs text-brand-gold uppercase type-label">
            {item.scene[locale]}
          </span>
          <h2 className="type-card-title text-xl sm:text-2xl mt-2 group-hover:text-brand-gold transition-colors">
            {item.title[locale]}
          </h2>
          <p className="text-sm text-gray-500 type-label mt-2">{item.products}</p>
          <p className="text-gray-400 mt-3 leading-relaxed">{item.desc[locale]}</p>
        </div>
      </article>
    </Link>
  );
}
