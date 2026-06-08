"use client";

import type { QRItem } from "@/data/mock";
import { SafeImageContain } from "@/components/SafeImage";
import { useI18n } from "./I18nProvider";

/** 静态二维码展示（不依赖 Swiper，避免客户端崩溃） */
export default function QRCarousel({ items }: { items: QRItem[] }) {
  const { locale, t } = useI18n();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 safe-x">
      <p className="text-center text-xs text-gray-500 mb-6 tracking-widest uppercase">
        {t.footer.scan}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 max-w-lg mx-auto">
        {items.map((qr) => (
          <div key={qr.id} className="flex flex-col items-center gap-2 sm:gap-3">
            <SafeImageContain
              src={qr.image}
              alt={qr.label[locale]}
              size={72}
              className="rounded-lg border border-white/10 w-[72px] sm:w-24 sm:h-24"
            />
            <span className="text-[11px] sm:text-xs text-gray-400 text-center leading-snug">
              {qr.label[locale]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
