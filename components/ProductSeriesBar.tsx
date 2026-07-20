"use client";

import ProductFilterChip from "@/components/products/ProductFilterChip";
import type { ReactNode } from "react";
import { useI18n } from "./I18nProvider";

export type ProductFilterTab = {
  id: string;
  label: string;
};

export default function ProductSeriesBar({
  tabs,
  activeId,
  onChange,
  resultCount,
  search,
}: {
  tabs: ProductFilterTab[];
  activeId: string;
  onChange: (id: string) => void;
  resultCount: number;
  search?: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="mb-6 md:mb-10">
      <div className="sticky-filter-bar md:space-y-6 md:mb-0 mb-0 space-y-3">
        {search ? <div className="md:hidden w-full px-1">{search}</div> : null}

        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4 md:border-b md:border-white/10 md:pb-4 px-1 md:px-0">
          <div className="filter-scroll md:gap-3 min-w-0 pb-1 md:pb-0">
            {tabs.map((tab) => (
              <ProductFilterChip
                key={tab.id}
                active={activeId === tab.id}
                onClick={() => onChange(tab.id)}
              >
                {tab.label}
              </ProductFilterChip>
            ))}
          </div>
          <span className="text-xs text-gray-500 md:hidden px-1">
            {t.products.total.replace("{count}", String(resultCount))}
          </span>
          {search ? (
            <div className="hidden md:block w-full md:w-72 lg:w-80 shrink-0">{search}</div>
          ) : null}
        </div>

        <p className="hidden md:block text-xs text-gray-500 px-1 md:px-0">
          {t.products.total.replace("{count}", String(resultCount))}
        </p>
      </div>
    </div>
  );
}
