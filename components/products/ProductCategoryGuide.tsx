"use client";

import type { ProductCategoryType } from "@/lib/product-classification";
import ProductFilterChip from "@/components/products/ProductFilterChip";

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
  const chips = CATEGORIES.map((category) => (
    <ProductFilterChip
      key={category}
      active={active === category}
      onClick={() => onChange(category)}
    >
      {labels[category]}
    </ProductFilterChip>
  ));

  return (
    <nav aria-label={title} className={className}>
      {/* 手机：横滑 Chip，与系列筛选条一致 */}
      <div className="flex flex-col gap-3 md:hidden">
        <p className="type-section-label text-center">{title}</p>
        <div className="filter-scroll -mx-1 px-1 pb-1">{chips}</div>
      </div>

      {/* 电脑 / 平板：横向胶囊 */}
      <div className="hidden md:flex md:flex-col md:gap-3 md:items-center">
        <p className="type-section-label">{title}</p>
        <div className="flex flex-row flex-wrap justify-center gap-2.5">{chips}</div>
      </div>
    </nav>
  );
}
