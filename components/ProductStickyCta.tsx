"use client";

import type { Product } from "@/data/mock";
import { useI18n } from "@/components/I18nProvider";
import { FileDown, MessageCircle, Receipt } from "lucide-react";
import Link from "next/link";

export default function ProductStickyCta({ product }: { product: Product }) {
  const { t } = useI18n();
  const contactHref = `/contact?product=${encodeURIComponent(product.model)}`;
  const downloadsHref = `/downloads?product=${encodeURIComponent(product.model)}`;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-black/90 backdrop-blur-md safe-bottom md:hidden">
      <div className="grid grid-cols-3 gap-1 p-2 max-w-lg mx-auto">
        <Link
          href={contactHref}
          className="flex flex-col items-center justify-center gap-1 min-h-[52px] rounded-lg bg-brand-gold/90 text-black text-[11px] font-medium touch-active"
        >
          <Receipt size={16} />
          {t.products.requestQuote}
        </Link>
        <Link
          href={contactHref}
          className="flex flex-col items-center justify-center gap-1 min-h-[52px] rounded-lg border border-white/15 text-white text-[11px] touch-active"
        >
          <MessageCircle size={16} />
          {t.products.contactEngineer}
        </Link>
        <Link
          href={downloadsHref}
          className="flex flex-col items-center justify-center gap-1 min-h-[52px] rounded-lg border border-white/15 text-white text-[11px] touch-active"
        >
          <FileDown size={16} />
          {t.products.downloadMaterials}
        </Link>
      </div>
    </div>
  );
}

export function ProductDetailActions({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const { t } = useI18n();
  const contactHref = `/contact?product=${encodeURIComponent(product.model)}`;
  const downloadsHref = `/downloads?product=${encodeURIComponent(product.model)}`;

  return (
    <div className={`flex flex-col sm:flex-row flex-wrap gap-3 ${className}`}>
      <Link
        href={contactHref}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-6 rounded-xl bg-brand-gold/90 text-black text-sm font-medium hover:bg-brand-gold transition-colors touch-active"
      >
        <Receipt size={16} />
        {t.products.requestQuote}
      </Link>
      <Link
        href={contactHref}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-6 rounded-xl border border-white/20 text-white text-sm hover:border-brand-gold/40 transition-colors touch-active"
      >
        <MessageCircle size={16} />
        {t.products.contactEngineer}
      </Link>
      <Link
        href={downloadsHref}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-6 rounded-xl border border-white/20 text-gray-300 text-sm hover:border-white/40 transition-colors touch-active"
      >
        <FileDown size={16} />
        {t.products.downloadMaterials}
      </Link>
    </div>
  );
}
