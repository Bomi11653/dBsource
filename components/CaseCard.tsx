"use client";

import type { CaseItem } from "@/data/mock";
import type { Locale } from "@/lib/i18n";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";

export default function CaseCard({
  item,
  locale,
  emptyImage = false,
}: {
  item: CaseItem;
  locale: Locale;
  index?: number;
  /** 保留缩略图框，不显示图片（待上传封面） */
  emptyImage?: boolean;
}) {
  return (
    <Link
      href={`/cases/${item.id}`}
      className="group card-touch block"
    >
      <article className="flex flex-col md:flex-row gap-0 md:gap-6 border border-white/10 rounded-xl overflow-hidden hover:border-brand-gold/30 transition-colors active:border-brand-gold/20">
        {emptyImage ? (
          <div
            className="w-full md:w-72 shrink-0 bg-zinc-900/70 md:border-r border-white/5"
            style={{ minHeight: 200 }}
            aria-hidden
          />
        ) : (
          <div className="w-full md:w-72 shrink-0">
            <SafeImage
              src={item.image}
              alt={item.title[locale]}
              frameHeight={200}
              frameWidth="100%"
              sizes="(max-width: 768px) 100vw, 33vw"
              loading="lazy"
            />
          </div>
        )}
        <div className="p-4 sm:p-6 flex flex-col justify-center">
          <span className="text-xs text-brand-gold uppercase tracking-wider">
            {item.scene[locale]}
          </span>
          <h2 className="text-xl sm:text-2xl font-light mt-2 group-hover:text-brand-gold transition-colors leading-snug">
            {item.title[locale]}
          </h2>
          <p className="text-sm text-gray-500 font-mono mt-2">{item.products}</p>
          <p className="text-gray-400 mt-3 leading-relaxed">{item.desc[locale]}</p>
        </div>
      </article>
    </Link>
  );
}
