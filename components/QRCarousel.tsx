"use client";

import type { QRItem } from "@/data/mock";
import { SafeImageContain } from "@/components/SafeImage";
import { useI18n } from "./I18nProvider";

/** 静态二维码展示（不依赖 Swiper，避免客户端崩溃） */
export default function QRCarousel({ items }: { items: QRItem[] }) {
  const { locale, t } = useI18n();

  return (
    <div className="max-w-4xl mx-auto px-6">
      <p className="text-center text-xs text-gray-500 mb-6 tracking-widest uppercase">
        {t.footer.scan}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {items.map((qr) => (
          <div key={qr.id} className="flex flex-col items-center gap-3">
            <SafeImageContain
              src={qr.image}
              alt={qr.label[locale]}
              size={96}
              className="rounded-lg border border-white/10"
            />
            <span className="text-xs text-gray-400 text-center">{qr.label[locale]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
