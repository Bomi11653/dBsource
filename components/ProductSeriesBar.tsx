"use client";

import type { ReactNode } from "react";
import {
  PRODUCT_SERIES_TABS,
  type ProductSeriesTabFilter,
} from "@/lib/product-series-tabs";
import { useI18n } from "./I18nProvider";

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const base = "filter-chip touch-active transition";
  const pillActive = "bg-brand-gold/90 text-black";
  const pillIdle = "bg-white/5 text-gray-300 hover:bg-white/10";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${active ? pillActive : pillIdle}`}
    >
      {children}
    </button>
  );
}

export default function ProductSeriesBar({
  seriesFilter,
  onSeriesChange,
  resultCount,
  search,
}: {
  seriesFilter: ProductSeriesTabFilter;
  onSeriesChange: (tab: ProductSeriesTabFilter) => void;
  resultCount: number;
  search?: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="mb-6 md:mb-10">
      <div className="sticky top-[calc(4.25rem+env(safe-area-inset-top,0px))] z-30 -mx-1 px-1 py-3 md:static md:mx-0 md:px-0 md:py-0 bg-black/92 backdrop-blur-xl md:bg-transparent border-b border-white/10 md:border-0 space-y-3 md:space-y-6">
        {search ? <div className="md:hidden w-full">{search}</div> : null}

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4 md:border-b md:border-white/10 md:pb-4">
          <div className="flex items-center justify-between gap-3 md:contents">
            <div className="filter-scroll md:flex md:flex-wrap md:gap-3 flex-1 min-w-0">
              {PRODUCT_SERIES_TABS.map((tab) => (
                <FilterButton
                  key={tab.id}
                  active={seriesFilter === tab.id}
                  onClick={() => onSeriesChange(tab.id)}
                >
                  {tab.label}
                </FilterButton>
              ))}
            </div>
            <span className="shrink-0 text-xs text-gray-500 md:hidden">{resultCount}</span>
          </div>
          {search ? (
            <div className="hidden md:block w-full md:w-72 lg:w-80 shrink-0">{search}</div>
          ) : null}
        </div>

        <p className="hidden md:block text-xs text-gray-500">
          {t.products.total.replace("{count}", String(resultCount))}
        </p>
      </div>
    </div>
  );
}
