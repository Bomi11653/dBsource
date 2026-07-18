"use client";

import type { ProductCategoryType } from "@/lib/product-classification";

type ProductCategoryGuideProps = {
  title: string;
  active: ProductCategoryType;
  labels: Record<ProductCategoryType, string>;
  onChange: (category: ProductCategoryType) => void;
  className?: string;
};

const CATEGORIES: ProductCategoryType[] = ["engineering", "touring"];

export default function ProductCategoryGuide({
  title,
  active,
  labels,
  onChange,
  className = "",
}: ProductCategoryGuideProps) {
  return (
    <nav aria-label={title} className={`flex flex-col gap-3 ${className}`}>
      <p className="text-xs uppercase tracking-[0.28em] text-gray-500 text-center md:text-inherit">
        {title}
      </p>
      <div className="flex flex-col items-stretch gap-2 w-full max-w-[260px] mx-auto md:max-w-none md:flex-row md:flex-wrap md:justify-center md:items-center md:gap-2.5">
        {CATEGORIES.map((category) => {
          const isActive = active === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onChange(category)}
              className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 min-h-[44px] text-sm transition-colors touch-active w-full md:w-auto ${
                isActive
                  ? "border-brand-gold/50 bg-brand-gold/15 text-brand-gold"
                  : "border-white/15 bg-white/5 text-gray-300 hover:border-white/30 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{labels[category]}</span>
              <span aria-hidden className="text-white/50">
                →
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
