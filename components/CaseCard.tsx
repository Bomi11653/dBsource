"use client";

import type { CaseItem } from "@/data/mock";
import type { Locale } from "@/lib/i18n";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";

export default function CaseCard({
  item,
  locale,
}: {
  item: CaseItem;
  locale: Locale;
  index?: number;
}) {
  return (
    <Link
      href={`/cases/${item.id}`}
      className="group block"
    >
      <article className="flex flex-col md:flex-row gap-6 border border-white/10 rounded-xl overflow-hidden hover:border-brand-gold/30 transition-colors">
        <div className="md:w-72 shrink-0" style={{ minHeight: 192 }}>
          <SafeImage
            src={item.image}
            alt={item.title[locale]}
            frameHeight={192}
            frameWidth="100%"
            sizes="(max-width: 768px) 100vw, 33vw"
            loading="lazy"
          />
        </div>
        <div className="p-6 flex flex-col justify-center">
          <span className="text-xs text-brand-gold uppercase tracking-wider">
            {item.scene[locale]}
          </span>
          <h2 className="text-2xl font-light mt-2 group-hover:text-brand-gold transition-colors">
            {item.title[locale]}
          </h2>
          <p className="text-sm text-gray-500 font-mono mt-2">{item.products}</p>
          <p className="text-gray-400 mt-3 leading-relaxed">{item.desc[locale]}</p>
        </div>
      </article>
    </Link>
  );
}
