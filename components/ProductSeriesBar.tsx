"use client";

import type { CategoryFilter, SeriesTab } from "@/lib/products";
import { useI18n } from "./I18nProvider";

const SERIES_TABS: SeriesTab[] = ["all", "speaker", "dsp", "software", "engineering"];
const CATEGORY_FILTERS: CategoryFilter[] = ["all", "speaker", "dsp", "software"];

export default function ProductSeriesBar({
  seriesTab,
  categoryFilter,
  onSeriesChange,
  onCategoryChange,
  resultCount,
}: {
  seriesTab: SeriesTab;
  categoryFilter: CategoryFilter;
  onSeriesChange: (tab: SeriesTab) => void;
  onCategoryChange: (cat: CategoryFilter) => void;
  resultCount: number;
}) {
  const { t } = useI18n();

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
    <div className="mb-10 space-y-6">
      <div className="flex flex-wrap gap-2 md:gap-3 border-b border-white/10 pb-4">
        {SERIES_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onSeriesChange(tab)}
            className={`px-4 py-2 rounded-full text-sm transition ${
              seriesTab === tab
                ? "bg-brand-gold/90 text-black"
                : "bg-white/5 hover:bg-white/10 text-gray-300"
            }`}
          >
            {seriesLabels[tab]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          {t.products.filterLabel}
        </span>
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange(cat)}
            className={`px-3 py-1.5 rounded-md text-xs transition border ${
              categoryFilter === cat
                ? "border-brand-gold/50 text-brand-gold bg-brand-gold/10"
                : "border-white/10 text-gray-400 hover:border-white/20"
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
        <span className="text-xs text-gray-500 ml-auto">
          {t.products.total.replace("{count}", String(resultCount))}
        </span>
      </div>
    </div>
  );
}
