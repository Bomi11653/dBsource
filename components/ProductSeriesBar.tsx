"use client";

import type { ReactNode } from "react";
import {
  type CategoryFilter,
  type ProductSubSeriesSlug,
  type SeriesTab,
} from "@/lib/products";
import { getSubSeriesForGroupFromConfig, seriesEntryLabel } from "@/lib/series-config";
import { useSeriesConfig } from "@/components/SeriesConfigProvider";
import { useI18n } from "./I18nProvider";

const SERIES_TABS: SeriesTab[] = ["all", "speaker", "dsp", "software", "engineering"];
const CATEGORY_FILTERS: CategoryFilter[] = ["all", "speaker", "dsp", "software"];

function FilterButton({
  active,
  onClick,
  children,
  variant = "pill",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "pill" | "tag";
}) {
  const base = "filter-chip touch-active transition";
  const pillActive = "bg-brand-gold/90 text-black";
  const pillIdle = "bg-white/5 text-gray-300 hover:bg-white/10";
  const tagActive = "border border-brand-gold/50 text-brand-gold bg-brand-gold/10 rounded-lg";
  const tagIdle = "border border-white/10 text-gray-400 hover:border-white/20 rounded-lg";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${variant === "pill" ? (active ? pillActive : pillIdle) : active ? tagActive : tagIdle}`}
    >
      {children}
    </button>
  );
}

export default function ProductSeriesBar({
  seriesTab,
  categoryFilter,
  subSeries,
  onSeriesChange,
  onCategoryChange,
  onSubSeriesChange,
  resultCount,
  search,
}: {
  seriesTab: SeriesTab;
  categoryFilter: CategoryFilter;
  subSeries: ProductSubSeriesSlug | "all";
  onSeriesChange: (tab: SeriesTab) => void;
  onCategoryChange: (cat: CategoryFilter) => void;
  onSubSeriesChange: (sub: ProductSubSeriesSlug | "all") => void;
  resultCount: number;
  search?: ReactNode;
}) {
  const { locale, t } = useI18n();
  const seriesConfig = useSeriesConfig();
  const subSeriesOptions =
    seriesTab !== "all" ? getSubSeriesForGroupFromConfig(seriesTab, seriesConfig) : [];
  const showCategoryRow = seriesTab === "all";

  const seriesLabels: Record<SeriesTab, string> = {
    all: t.products.seriesAll,
    speaker: t.products.seriesSpeaker,
    dsp: t.products.seriesDsp,
    software: t.products.seriesSoftware,
    engineering: t.products.seriesEngineering,
  };

  const categoryLabels: Record<CategoryFilter, string> = {
    all: t.products.filterAll,
    speaker: t.products.filterSpeaker,
    dsp: t.products.filterDsp,
    software: t.products.filterSoftware,
  };

  return (
    <div className="mb-6 md:mb-10">
      <div className="sticky top-[calc(4.25rem+env(safe-area-inset-top,0px))] z-30 -mx-1 px-1 py-3 md:static md:mx-0 md:px-0 md:py-0 bg-black/92 backdrop-blur-xl md:bg-transparent border-b border-white/10 md:border-0 space-y-3 md:space-y-6">
        {search ? <div className="md:hidden w-full">{search}</div> : null}

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4 md:border-b md:border-white/10 md:pb-4">
          <div className="flex items-center justify-between gap-3 md:contents">
            <div className="filter-scroll md:flex md:flex-wrap md:gap-3 flex-1 min-w-0">
              {SERIES_TABS.map((tab) => (
                <FilterButton
                  key={tab}
                  active={seriesTab === tab}
                  onClick={() => onSeriesChange(tab)}
                  variant="pill"
                >
                  {seriesLabels[tab]}
                </FilterButton>
              ))}
            </div>
            <span className="shrink-0 text-xs text-gray-500 md:hidden">{resultCount}</span>
          </div>
          {search ? (
            <div className="hidden md:block w-full md:w-72 lg:w-80 shrink-0">{search}</div>
          ) : null}
        </div>

        {subSeriesOptions.length > 0 && (
          <div className="md:flex md:flex-wrap md:items-center md:gap-3">
            <span className="block text-xs text-gray-500 mb-2 md:mb-0 uppercase tracking-wider shrink-0">
              {t.nav.megaSubSeries}
            </span>
            <div className="filter-scroll md:flex md:flex-wrap md:gap-2">
              <FilterButton
                active={subSeries === "all"}
                onClick={() => onSubSeriesChange("all")}
                variant="tag"
              >
                {t.products.filterAll}
              </FilterButton>
              {subSeriesOptions.map((sub) => (
                <FilterButton
                  key={sub.slug}
                  active={subSeries === sub.slug}
                  onClick={() => onSubSeriesChange(sub.slug)}
                  variant="tag"
                >
                  {seriesEntryLabel(sub, locale)}
                </FilterButton>
              ))}
            </div>
          </div>
        )}

        {showCategoryRow && (
          <div className="md:flex md:flex-wrap md:items-center md:gap-3">
            <span className="block text-xs text-gray-500 mb-2 md:mb-0 uppercase tracking-wider shrink-0">
              {t.products.filterLabel}
            </span>
            <div className="filter-scroll md:flex md:flex-wrap md:gap-2 flex-1">
              {CATEGORY_FILTERS.map((cat) => (
                <FilterButton
                  key={cat}
                  active={categoryFilter === cat}
                  onClick={() => onCategoryChange(cat)}
                  variant="tag"
                >
                  {categoryLabels[cat]}
                </FilterButton>
              ))}
            </div>
            <span className="hidden md:inline text-xs text-gray-500 ml-auto shrink-0">
              {t.products.total.replace("{count}", String(resultCount))}
            </span>
          </div>
        )}

        {!showCategoryRow && (
          <p className="hidden md:block text-xs text-gray-500">
            {t.products.total.replace("{count}", String(resultCount))}
          </p>
        )}
      </div>
    </div>
  );
}
